import { Migration } from "@mikro-orm/migrations";

export class Migration2 extends Migration {
    async up(): Promise<void> {
        this.addSql("alter table `registrations` add column `gw2_guild_ids` text null;");
    }
}
