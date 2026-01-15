import { createAdminClient } from './supabase/server';

export type CronJobStatus = 'started' | 'success' | 'failed';

export interface CronLogOptions {
    jobName: string;
    status: CronJobStatus;
    message?: string;
    details?: any;
    durationMs?: number;
}

export async function logCronJob({
    jobName,
    status,
    message,
    details,
    durationMs
}: CronLogOptions) {
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from('cron_job_logs')
            .insert({
                job_name: jobName,
                status,
                message,
                details,
                duration_ms: durationMs,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error(`Failed to log cron job ${jobName}:`, error);
        }
    } catch (error) {
        console.error(`Error in logCronJob for ${jobName}:`, error);
    }
}

export class CronLogger {
    private jobName: string;
    private startTime: number;

    constructor(jobName: string) {
        this.jobName = jobName;
        this.startTime = Date.now();
    }

    async logStart(message?: string, details?: any) {
        await logCronJob({
            jobName: this.jobName,
            status: 'started',
            message,
            details
        });
    }

    async logSuccess(message?: string, details?: any) {
        const durationMs = Date.now() - this.startTime;
        await logCronJob({
            jobName: this.jobName,
            status: 'success',
            message,
            details,
            durationMs
        });
    }

    async logFailure(error: any, message?: string) {
        const durationMs = Date.now() - this.startTime;
        await logCronJob({
            jobName: this.jobName,
            status: 'failed',
            message: message || error.message,
            details: {
                error: error.message,
                stack: error.stack,
                ... (typeof error === 'object' ? error : {})
            },
            durationMs
        });
    }
}
