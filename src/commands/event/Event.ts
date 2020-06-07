import moment = require("moment");
import schedule = require("node-schedule");
import discord = require("discord.js");
import LinkedList = require("singly-linked-list");

export class EventCalendar {
    private events: Event[]

    public constructor() {
        this.events = new LinkedList()
    }

    public scheduleEvent(e: Event) {
        /*
        if(this.events.isEmpty()) {
            this.events.insert(e);
        } else {
            let n: LinkedList.ListNode = this.events.getHeadNode();
            while(n.next !== null && n.nextExecution() < e.nextExecution()) {
                n = n.next;
            }
            this.events.insertAfter(n, e);
            n = n.next; // now pointing to the new event
            // assert n.getData() === e
            let p: discord.Message = n.getPost();
            let tmp: discord.Message;
            while(n !== null) {
                if(n.next !== null) {
                    tmp = n.next.getPost();
                }
                
                n = n.next;
                if(n !== null) {

                }
            }


        }*/
        
    }
}

export class Event {
    private schedule: moment.Moment | string 
    private title: string;
    private description: string | null
    private reminder: number | null;
    private job: schedule.Job;
    private reminderJob: schedule.Job | null;
    private post: discord.Message;

    public nextExecution(): Date {
        return this.job.nextInvocation();
    }

    public getPost(): discord.Message {
        return this.post;
    }

    public setPost(p: discord.Message): void {
        this.post = p;
    }

    public constructor(schedule: moment.Moment | string, title: string, description: string | null, reminder: number | null) {
        return;
        /*this.schedule = schedule;
        this.title = title;
        this.description = description;
        this.reminder = reminder;
        const sched: Date | string = (schedule instanceof moment.Moment) ? (<moment.Moment>schedule).toDate() : <string>schedule;
        this.job = schedule.scheduleJob(sched, () => null); // FIXME: moment -> date
        if(this.reminder !== null && this.reminder > 0) {
            const reminderDate = this.nextExecution();
            reminderDate.setDate(reminderDate.getDate() - 60 * this.reminder);
            this.reminderJob = schedule.scheduleJob(reminderDate, () => null)
        }*/
    }
}