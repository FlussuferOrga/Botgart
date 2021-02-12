//import * as sqlite3 from "better-sqlite3";
import better_sqlite3 from "better-sqlite3";
import { parentPort } from "worker_threads";

const db = better_sqlite3('/tmp/foobar.db');



//console.log(workerData);
//const { dbSpawner } = workerData;

parentPort?.on("message", ({ sql, parameters }) => {

	//const db = sqlite3.default("/tmp/foo.db", undefined);
    db.pragma("foreign_keys = ON");
    const res = db.prepare(sql).all(...parameters);
    db.close();
    parentPort?.postMessage(res);
});