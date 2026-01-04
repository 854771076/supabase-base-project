import { createClient } from '@/utils/supabase/server';

export type PlanFeatures = {
    api_access?: boolean;
    advanced_features?: boolean;
    [key: string]: any;
};

export type PlanQuotas = {
    daily_requests?: number;
    [key: string]: any;
};

/**
 * Get the current user's subscription and plan details
 */
export async function getUserSubscription() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select(`
            *,
            plans (*)
        `)
        .eq('user_id', user.id)
        .single();

    if (error || !subscription) {
        console.error('Error fetching subscription:', error);
        return null;
    }

    return subscription;
}

/**
 * Check if the user has permission for a specific feature
 */
export async function checkFeaturePermission(featureName: keyof PlanFeatures) {
    const subscription = await getUserSubscription();
    if (!subscription) return false;

    const features = subscription.plans.features as PlanFeatures;
    return !!features[featureName];
}

/**
 * Check if the user has remaining quota for a feature
 */
export async function checkQuota(featureName: string, quotaKey: keyof PlanQuotas) {
    const subscription = await getUserSubscription();
    if (!subscription) return { allowed: false, error: 'No subscription found' };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { allowed: false, error: 'Unauthorized' };

    // 1. Get current usage
    const { data: usageRecord } = await supabase
        .from('usage_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('feature_name', featureName)
        .single();

    const currentUsage = usageRecord?.usage_count || 0;
    const quotas = subscription.plans.quotas as PlanQuotas;
    const limit = quotas[quotaKey];

    if (limit === undefined) return { allowed: true }; // No limit defined

    // 2. If plan quota reached, check purchased credits
    if (currentUsage >= limit) {
        const { data: creditRecord } = await supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', user.id)
            .single();

        const balance = creditRecord?.balance || 0;
        if (balance > 0) {
            return { allowed: true, currentUsage, limit, usingCredits: true, creditBalance: balance };
        }

        return { allowed: false, error: `Quota exceeded for ${featureName}`, currentUsage, limit, creditBalance: balance };
    }

    return { allowed: true, currentUsage, limit, usingCredits: false };
}

/**
 * Get all available plans
 */
export async function getPlans() {
    const supabase = await createClient();
    const { data: plans, error } = await supabase
        .from('plans')
        .select('*')
        .order('price_cents', { ascending: true });

    if (error) {
        console.error('Error fetching plans:', error);
        return [];
    }

    return plans;
}

/**
 * Update the current user's subscription to a new plan
 * @param planId Target plan ID
 * @param isPaidAction Whether this update is triggered by a verified payment (e.g. PayPal capture)
 */
export async function updateUserSubscription(planId: string, isPaidAction: boolean = false) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // 1. Get the target plan details
    const { data: targetPlan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

    if (!targetPlan) throw new Error('Plan not found');

    // 2. Security Check: Block paid plans if not a verified payment action
    if (targetPlan.price_cents > 0 && !isPaidAction) {
        throw new Error('This plan requires a verified payment. Please use the payment flow.');
    }

    // 3. Check current subscription to prevent accidental downgrade to Free
    const currentSub = await getUserSubscription();
    if (currentSub && currentSub.plans.price_cents > 0 && targetPlan.price_cents === 0) {
        throw new Error('You already have an active Pro subscription. Downgrading to Free is not allowed here.');
    }

    // 4. Calculate period end (30 days from now)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const { data: subscription, error } = await supabase
        .from('subscriptions')
        .upsert({
            user_id: user.id,
            plan_id: planId,
            status: 'active',
            current_period_end: periodEnd.toISOString(),
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select(`
            *,
            plans (*)
        `)
        .single();

    if (error) {
        console.error('Error updating subscription:', error);
        throw error;
    }

    return subscription;
}

/**
 * Increment the usage count for a feature
 */
export async function incrementUsage(featureName: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // 1. Check if we should use plan quota or purchased credits
    const subscription = await getUserSubscription();
    if (!subscription) throw new Error('No subscription');

    const { data: usageRecord } = await supabase
        .from('usage_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('feature_name', featureName)
        .single();

    const currentUsage = usageRecord?.usage_count || 0;
    const quotas = subscription.plans.quotas as PlanQuotas;

    // We assume the quota key matches featureName for simplicity or it's mapped
    const quotaKey = featureName === 'api_request' ? 'daily_requests' : null;
    const limit = quotaKey ? (quotas[quotaKey] as number) : Infinity;

    if (currentUsage >= limit) {
        // Use purchased credits
        const { data: credits, error: creditError } = await supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', user.id)
            .single();

        if (creditError || !credits || credits.balance <= 0) {
            throw new Error('Quota exceeded and no credits available');
        }

        const { error: updateError } = await supabase
            .from('user_credits')
            .update({ balance: credits.balance - 1, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);

        if (updateError) throw updateError;
    } else {
        // Increment daily usage
        const { error } = await supabase.rpc('increment_usage', {
            user_id_param: user.id,
            feature_name_param: featureName
        });

        if (error) {
            // Manual fallback if RPC fails
            if (usageRecord) {
                await supabase
                    .from('usage_records')
                    .update({ usage_count: usageRecord.usage_count + 1, updated_at: new Date().toISOString() })
                    .eq('id', usageRecord.id);
            } else {
                await supabase
                    .from('usage_records')
                    .insert({ user_id: user.id, feature_name: featureName, usage_count: 1 });
            }
        }
    }
}

/**
 * Get the current user's credit balance
 */
export async function getUserCredits() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const { data: credits, error } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching user credits:', error);
        return 0;
    }

    return credits.balance;
}

/**
 * Get all available credit products
 */
export async function getCreditProducts() {
    const supabase = await createClient();
    const { data: products, error } = await supabase
        .from('credit_products')
        .select('*')
        .order('price_cents', { ascending: true });

    if (error) {
        console.error('Error fetching credit products:', error);
        return [];
    }

    return products;
}
/**
 * Get the current user's usage records
 */
export async function getUserUsage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: usage, error } = await supabase
        .from('usage_records')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching usage records:', error);
        return [];
    }

    return usage;
}
