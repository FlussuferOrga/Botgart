import { Migration } from "@mikro-orm/migrations";

export class Migration0 extends Migration {
    private readonly _tables = [
        "command_permissions",
        "cronjobs",
        "discord_log_channels",
        "faqs",
        "faq_keys",
        "fish",
        "caught_fish",
        "permanent_roles",
        "registrations",
        "reset_rosters",
        "reset_leaders",
    ];

    async up(): Promise<void> {
        this.addSql(
            "create table `command_permissions` (`command_permissions_id` integer not null primary key autoincrement, `command` text not null, `receiver` text not null, `type` text not null, `guild` text not null, `value` integer not null, `timestamp` timestamp not null default CURRENT_TIMESTAMP);"
        );

        this.addSql(
            "create table `cronjobs` (`id` integer not null primary key autoincrement, `schedule` text not null, `command` text not null, `arguments` text null, `created_by` text not null, `guild` text not null, `created` timestamp null default CURRENT_TIMESTAMP);"
        );

        this.addSql(
            "create table `discord_log_channels` (`discord_log_channel_id` integer not null primary key autoincrement, `guild` text not null, `type` text not null, `channel` text not null);"
        );

        this.addSql(
            "create table `faqs` (`id` integer not null primary key autoincrement, `text` text not null, `created_by` text not null, `guild` text not null, `created` timestamp null default CURRENT_TIMESTAMP);"
        );

        this.addSql(
            "create table `faq_keys` (`id` integer not null primary key autoincrement, `key` text not null, `faq_id` integer not null, constraint `faq_keys_faq_id_foreign` foreign key(`faq_id`) references `faqs`(`id`) on delete cascade on update cascade);"
        );
        this.addSql("create index `index_faq_keys_key` on `faq_keys` (`key`);");
        this.addSql("create index `faq_keys_faq_id_index` on `faq_keys` (`faq_id`);");

        this.addSql(
            "create table `fish` (`fish_id` integer null, `name` text null, `image` text null, `rarity` real null default 1, `min_weight` integer null, `max_weight` integer null, `points_per_gramm` real null default 1, `reel_time_factor` real null default 1, primary key (`fish_id`));"
        );

        this.addSql(
            "create table `caught_fish` (`caught_id` integer not null primary key autoincrement, `fish_id` integer not null, `weight` integer not null, `user` text not null, `timestamp` timestamp not null default CURRENT_TIMESTAMP, constraint `caught_fish_fish_id_foreign` foreign key(`fish_id`) references `fish`(`fish_id`) on delete cascade on update cascade);"
        );
        this.addSql("create index `caught_fish_fish_id_index` on `caught_fish` (`fish_id`);");

        this.addSql(
            "create table `permanent_roles` (`id` integer not null primary key autoincrement, `guild` text not null, `user` text not null, `role` text not null, `created` timestamp null default CURRENT_TIMESTAMP);"
        );

        this.addSql(
            "create table `registrations` (`guild` text not null, `user` text not null, `api_key` text not null, `gw2account` text not null, `current_world_id` integer not null, `account_name` text not null, `created` timestamp null default CURRENT_TIMESTAMP, primary key (`guild`, `user`));"
        );
        this.addSql("create unique index `registrations_guild_api_key_unique` on `registrations` (`guild`, `api_key`);");

        this.addSql(
            "create table `reset_rosters` (`reset_roster_id` integer not null primary key autoincrement, `week_number` integer not null, `year` integer not null, `guild` text not null, `channel` text not null, `message` text not null);"
        );

        this.addSql(
            "create table `reset_leaders` (`reset_leader_id` integer not null primary key autoincrement, `reset_roster_id` integer not null, `map` text not null, `player` text not null, `visible` integer not null, constraint `reset_leaders_reset_roster_id_foreign` foreign key(`reset_roster_id`) references `reset_rosters`(`reset_roster_id`) on delete cascade on update cascade);"
        );
        this.addSql("create index `reset_leaders_reset_roster_id_index` on `reset_leaders` (`reset_roster_id`);");
    }
}
