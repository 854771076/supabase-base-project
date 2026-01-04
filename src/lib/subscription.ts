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

    const { data: { user } } = await (await createClient()).auth.getUser();
    if (!user) return { allowed: false, error: 'Unauthorized' };

    // Get current usage
    const supabase = await createClient();
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

    if (currentUsage >= limit) {
        return { allowed: false, error: `Quota exceeded for ${featureName}`, currentUsage, limit };
    }

    return { allowed: true, currentUsage, limit };
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
 */
export async function updateUserSubscription(planId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data: subscription, error } = await supabase
        .from('subscriptions')
        .upsert({
            user_id: user.id,
            plan_id: planId,
            status: 'active',
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
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

    // Upsert usage record
    const { error } = await supabase.rpc('increment_usage', {
        user_id_param: user.id,
        feature_name_param: featureName
    });

    if (error) {
        // If RPC doesn't exist yet, we can fallback to manual update or suggest adding the RPC
        console.warn('RPC increment_usage failed, trying manual update:', error);

        const { data: existing } = await supabase
            .from('usage_records')
            .select('*')
            .eq('user_id', user.id)
            .eq('feature_name', featureName)
            .single();

        if (existing) {
            await supabase
                .from('usage_records')
                .update({ usage_count: existing.usage_count + 1, updated_at: new Date().toISOString() })
                .eq('id', existing.id);
        } else {
            await supabase
                .from('usage_records')
                .insert({
                    user_id: user.id,
                    feature_name: featureName,
                    usage_count: 1
                });
        }
    }
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
