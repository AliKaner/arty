import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.daily(
  "Remove abandoned uploads",
  { hourUTC: 3, minuteUTC: 0 },
  internal.maintenance.cleanup,
);
export default crons;
