import moment = require("moment");
import schedule = require("node-schedule")

export class Event {
    private date: moment.Moment | string 
    private title: string;
    private description: string | null
    private reminder: number | null;
    private job: schedule.Job;
    private reminderJob: schedule.Job | null;

    public nextExecution(): Date {
        return this.job.nextInvocation();
    }

    public constructor(date: moment.Moment | string, title: string, description: string | null, reminder: number | null) {
        this.date = date;
        this.title = title;
        this.description = description;
        this.reminder = reminder;
        this.job = schedule.scheduleJob(this.date, () => null); 
        if(this.reminder !== null && this.reminder > 0) {
            const reminderDate = this.nextExecution();
            reminderDate.setDate(reminderDate.getDate() - 60 * this.reminder);
            this.reminderJob = schedule.scheduleJob(reminderDate, () => null)
        }
    }
}