import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("Private world: real PostgreSQL policies, delivery, files and economy", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public,storage to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant select,insert,delete on storage.objects to authenticated;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
    create publication supabase_realtime;
  `);
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/001_private_world.sql", import.meta.url),
      "utf8",
    ),
  );
  const janny = "11111111-1111-4111-8111-111111111111";
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/002_private_push.sql", import.meta.url),
      "utf8",
    ),
  );
  const gela = "22222222-2222-4222-8222-222222222222";
  const outsider = "33333333-3333-4333-8333-333333333333";
  await db.exec(
    `insert into auth.users values('${janny}'),('${gela}'),('${outsider}'); insert into public.profiles values('${janny}','Janny','janny'),('${gela}','Gela','gela');`,
  );
  const asUser = async (id) =>
    db.exec(
      `reset role; set role authenticated; set request.jwt.claim.sub='${id}';`,
    );
  const count = async (table) =>
    Number(
      (await db.query(`select count(*) as n from public.${table}`)).rows[0].n,
    );

  await t.test(
    "Only invited profiles can see the room or administer it",
    async () => {
      await asUser(outsider);
      assert.equal(await count("profiles"), 0);
      await assert.rejects(
        db.exec(`insert into public.profiles values('${outsider}','X','gela')`),
      );
      await assert.rejects(db.exec(`select public.record_visit()`));
      await asUser(janny);
      assert.equal(await count("profiles"), 2);
      await assert.rejects(
        db.exec(`update public.profiles set role='gela' where id='${janny}'`),
      );
      await assert.rejects(
        db.exec(
          `insert into public.events(owner_id,title,day) values('${janny}','intrusion',current_date)`,
        ),
      );
    },
  );
  await t.test("Gela cannot read or write Janny’s private diary", async () => {
    await asUser(janny);
    await db.exec(
      `insert into public.moods(owner_id,mood,note) values('${janny}',1,'Private diary')`,
    );
    await asUser(gela);
    assert.equal(await count("moods"), 0);
    await assert.rejects(
      db.exec(
        `insert into public.moods(owner_id,mood,note) values('${janny}',3,'Forged')`,
      ),
    );
    await asUser(janny);
    assert.equal(await count("moods"), 1);
  });
  let message;
  await t.test(
    "Scheduled letters and attachments stay hidden until due",
    async () => {
      await asUser(gela);
      await db.exec(
        `insert into storage.objects(bucket_id,name) values('keepsakes','${gela}/private.png')`,
      );
      message = (
        await db.query(
          `insert into public.messages(sender_id,recipient_id,body,attachment,deliver_at) values('${gela}','${janny}','A future letter','${gela}/private.png',now()+interval '1 day') returning id`,
        )
      ).rows[0].id;
      await asUser(janny);
      assert.equal(await count("messages"), 0);
      assert.equal(
        (await db.query("select * from storage.objects")).rows.length,
        0,
      );
      await db.exec(`select public.mark_message_read('${message}')`);
      await db.exec("reset role");
      assert.equal(
        (
          await db.query(
            `select read_at from public.messages where id='${message}'`,
          )
        ).rows[0].read_at,
        null,
      );
      await db.exec(
        `update public.messages set deliver_at=now()-interval '1 minute' where id='${message}'`,
      );
      await asUser(janny);
      assert.equal(await count("messages"), 1);
      assert.equal(
        (await db.query("select * from storage.objects")).rows.length,
        1,
      );
      await db.exec(
        "select public.deliver_messages(); select public.deliver_messages();",
      );
      assert.equal(await count("notifications"), 1);
      await db.exec(`select public.mark_message_read('${message}')`);
      assert.ok(
        (
          await db.query(
            `select read_at from public.messages where id='${message}'`,
          )
        ).rows[0].read_at,
      );
      assert.ok(
        (await db.query("select read_at from public.notifications")).rows[0]
          .read_at,
      );
    },
  );
  await t.test("The sender and read timestamp cannot be forged", async () => {
    await asUser(janny);
    await assert.rejects(
      db.exec(
        `insert into public.messages(sender_id,recipient_id,body) values('${gela}','${janny}','Forged')`,
      ),
    );
    await assert.rejects(
      db.exec(
        `insert into public.messages(sender_id,recipient_id,body,read_at) values('${janny}','${gela}','Forged read',now())`,
      ),
    );
    await assert.rejects(
      db.exec(
        `update public.messages set body='Changed' where id='${message}'`,
      ),
    );
    await db.exec(
      `insert into public.messages(sender_id,recipient_id,body) values('${janny}','${gela}','A real reply')`,
    );
  });
  await t.test(
    "Daily rewards and purchases cannot manufacture coins",
    async () => {
      await asUser(janny);
      await db.exec(
        "select public.record_visit(); select public.record_visit();",
      );
      assert.equal(await count("visits"), 1);
      const balance = async () =>
        Number(
          (await db.query("select sum(amount) as total from public.coins"))
            .rows[0].total,
        );
      assert.equal(await balance(), 10);
      await db.exec(
        `select public.reward_activity('care'); select public.reward_activity('care'); select public.reward_activity('secret'); select public.reward_activity('secret');`,
      );
      assert.equal(await balance(), 16);
      await db.exec(`select public.purchase('flower')`);
      assert.equal(await balance(), 1);
      await assert.rejects(db.exec(`select public.purchase('flower')`));
      await assert.rejects(db.exec(`select public.purchase('cookie')`));
      await assert.rejects(db.exec(`select public.purchase('unknown')`));
      await assert.rejects(
        db.exec(
          `insert into public.coins(owner_id,amount,reason) values('${janny}',1000,'fake')`,
        ),
      );
      await assert.rejects(
        db.exec(
          `select public.reward_activity('memory','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')`,
        ),
      );
      assert.equal(await balance(), 1);
    },
  );
  await t.test(
    "Future open-when content and anonymous access are denied",
    async () => {
      await asUser(gela);
      await db.exec(
        `insert into public.open_when(owner_id,title,body,available_at) values('${janny}','Lo necesites','Private future content',now()+interval '1 day')`,
      );
      await asUser(janny);
      assert.equal(await count("open_when"), 0);
      await db.exec("reset role;set role anon");
      await assert.rejects(db.query("select * from public.messages"));
      await assert.rejects(db.exec("select public.record_visit()"));
    },
  );
  await t.test(
    "Push subscriptions stay private; only the server can claim due unread jobs",
    async () => {
      await asUser(janny);
      await db.exec(
        `insert into public.push_subscriptions(endpoint,owner_id,p256dh,auth) values('https://fcm.googleapis.com/test','${janny}','public-key','auth-key')`,
      );
      await asUser(gela);
      assert.equal(await count("push_subscriptions"), 0);
      await assert.rejects(
        db.exec(
          `insert into public.push_subscriptions(endpoint,owner_id,p256dh,auth) values('https://fcm.googleapis.com/forged','${janny}','x','x')`,
        ),
      );
      await assert.rejects(db.query("select * from public.push_jobs"));
      await assert.rejects(db.query("select * from public.claim_push_jobs()"));
      const immediate = (
        await db.query(
          `insert into public.messages(sender_id,recipient_id,body) values('${gela}','${janny}','Immediate') returning id`,
        )
      ).rows[0].id;
      await db.exec(
        `insert into public.messages(sender_id,recipient_id,body,deliver_at) values('${gela}','${janny}','Scheduled',now()+interval '1 day')`,
      );
      await db.exec("reset role; set role service_role");
      assert.equal(
        (await db.query("select * from public.push_jobs")).rows.length,
        2,
      );
      assert.equal(
        (await db.query(`select * from public.claim_push_jobs('${janny}')`))
          .rows.length,
        0,
      );
      const claimed = (
        await db.query(`select * from public.claim_push_jobs('${gela}')`)
      ).rows;
      assert.equal(claimed.length, 1);
      assert.equal(claimed[0].message_id, immediate);
      assert.ok(claimed[0].claim_token);
      assert.equal(claimed[0].attempts, 1);
      assert.equal(
        (await db.query("select * from public.claim_push_jobs()")).rows.length,
        0,
      );
      await asUser(janny);
      await db.exec(`select public.mark_message_read('${immediate}')`);
      await db.exec(
        "reset role; set role service_role; update public.push_jobs set available_at=now()-interval '1 minute'",
      );
      assert.equal(
        (await db.query("select * from public.claim_push_jobs()")).rows.length,
        0,
      );
      await asUser(outsider);
      assert.equal(await count("push_subscriptions"), 0);
      await asUser(janny);
      await db.exec("delete from public.push_subscriptions");
      await db.exec("reset role; set role service_role");
      assert.equal(
        (await db.query("select * from public.push_jobs")).rows.length,
        0,
      );
    },
  );
  await t.test(
    "Retrying a send returns the same letter and direct inserts are blocked",
    async () => {
      await db.exec("reset role");
      await db.exec(
        await readFile(
          new URL(
            "../supabase/migrations/003_reliable_messages.sql",
            import.meta.url,
          ),
          "utf8",
        ),
      );
      const request = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      await db.exec(
        await readFile(
          new URL(
            "../supabase/migrations/005_close_legacy_message_writes.sql",
            import.meta.url,
          ),
          "utf8",
        ),
      );
      await asUser(gela);
      const before = await count("messages");
      const first = (
        await db.query(
          `select * from public.send_private_message('${request}','${janny}','Exactly once')`,
        )
      ).rows[0];
      const retry = (
        await db.query(
          `select * from public.send_private_message('${request}','${janny}','A retried request')`,
        )
      ).rows[0];
      assert.equal(first.id, retry.id);
      assert.equal(retry.body, "Exactly once");
      assert.equal(await count("messages"), before + 1);
      await assert.rejects(
        db.exec(
          `insert into public.messages(sender_id,recipient_id,body) values('${gela}','${janny}','Bypass')`,
        ),
      );
      await asUser(outsider);
      await assert.rejects(
        db.exec(
          `select public.send_private_message(gen_random_uuid(),'${janny}','Intrusion')`,
        ),
      );
      await asUser(janny);
      await assert.rejects(
        db.exec(
          `select public.send_private_message(gen_random_uuid(),'${gela}','Future',null,null,false,now()+interval '1 day')`,
        ),
      );
      await assert.rejects(
        db.exec(
          `select public.send_private_message(gen_random_uuid(),'${gela}','Stolen file','${gela}/private.png','image/png')`,
        ),
      );
      await assert.rejects(
        db.exec(
          `select public.send_private_message(gen_random_uuid(),'${gela}','')`,
        ),
      );
      await db.exec(
        `select public.send_private_message('${request}','${gela}','The other sender has their own key')`,
      );
    },
  );
  await t.test(
    "Enabling push preserves previously scheduled letters; read jobs are removed",
    async () => {
      await db.exec("reset role");
      await db.exec(
        await readFile(
          new URL(
            "../supabase/migrations/004_push_retries.sql",
            import.meta.url,
          ),
          "utf8",
        ),
      );
      await asUser(gela);
      const letter = (
        await db.query(
          `select * from public.send_private_message(gen_random_uuid(),'${janny}','Scheduled before subscription',null,null,false,now()+interval '1 day')`,
        )
      ).rows[0];
      await asUser(janny);
      await db.exec(
        `insert into public.push_subscriptions(endpoint,owner_id,p256dh,auth) values('https://fcm.googleapis.com/later','${janny}','key','auth')`,
      );
      await db.exec("reset role; set role service_role");
      assert.equal(
        (
          await db.query(
            `select * from public.push_jobs where message_id='${letter.id}'`,
          )
        ).rows.length,
        1,
      );
      assert.equal(
        (await db.query("select * from public.claim_push_jobs()")).rows.length,
        0,
      );
      await db.exec(
        `reset role; update public.messages set deliver_at=now()-interval '1 minute' where id='${letter.id}'; update public.push_jobs set available_at=now()-interval '1 minute' where message_id='${letter.id}'; set role service_role`,
      );
      const claimed = (await db.query("select * from public.claim_push_jobs()"))
        .rows;
      assert.equal(claimed.length, 1);
      await asUser(janny);
      await db.exec(`select public.mark_message_read('${letter.id}')`);
      await db.exec("reset role; set role service_role");
      await db.query("select * from public.claim_push_jobs()");
      assert.equal(
        (
          await db.query(
            `select * from public.push_jobs where message_id='${letter.id}'`,
          )
        ).rows.length,
        0,
      );
    },
  );
});
