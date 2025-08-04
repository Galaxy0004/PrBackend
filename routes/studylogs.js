const express = require("express");
const router = express.Router();
const StudyLog = require("../models/StudyLog");

// Middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized: Please log in." });
}

router.use(ensureAuthenticated);

// POST: Log a new study session
router.post("/log", async (req, res) => {
  const { date, timeSpent } = req.body;
  const userId = req.user.id;
  try {
    let log = await StudyLog.findOne({ userId, date });
    if (log) {
      log.timeSpent += timeSpent;
    } else {
      log = new StudyLog({ userId, date, timeSpent });
    }
    await log.save();
    res.status(log.isNew ? 201 : 200).json(log);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET: All logs for the logged-in user
router.get("/logs", async (req, res) => {
  try {
    const logs = await StudyLog.find({ userId: req.user.id });
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// GET: All calculated stats for the logged-in user
router.get("/stats", async (req, res) => {
  try {
    const logs = await StudyLog.find({ userId: req.user.id });

    if (logs.length === 0) {
      return res.status(200).json({
        totalWeeklyHours: 0,
        weeklyAverage: 0,
        currentStreak: 0,
        longestStreak: 0,
      });
    }

    // --- TIMEZONE-SAFE HELPER ---
    // Creates a YYYY-MM-DD string from a Date object in the server's local timezone
    const toYYYYMMDD = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // --- Calculate Total Hours This Week ---
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1, ...
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const startOfWeekStr = toYYYYMMDD(startOfWeek);

    const totalWeeklyHours = logs
      .filter(log => log.date >= startOfWeekStr)
      .reduce((sum, log) => sum + log.timeSpent, 0);

    // --- STREAK CALCULATION (REWRITTEN) ---
    const logDates = new Set(logs.map(log => log.date)); // Set of "YYYY-MM-DD" strings
    let longestStreak = 0;
    let currentStreak = 0;

    // Calculate longest streak by iterating through all logs
    const sortedDates = [...logDates].sort();
    if (sortedDates.length > 0) {
        let tempStreak = 1;
        longestStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i-1]);
            const currDate = new Date(sortedDates[i]);
            prevDate.setDate(prevDate.getDate() + 1); // Increment previous date by 1 day
            if (toYYYYMMDD(prevDate) === toYYYYMMDD(currDate)) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }
            longestStreak = Math.max(longestStreak, tempStreak);
        }
    }

    // Calculate current streak by counting backwards from today
    let checkDate = new Date();
    if (logDates.has(toYYYYMMDD(checkDate))) {
        // User studied today, start counting backwards
        currentStreak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
        while (logDates.has(toYYYYMMDD(checkDate))) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
    } else {
        // User did not study today, check if they studied yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        if (logDates.has(toYYYYMMDD(checkDate))) {
            currentStreak = 1;
            checkDate.setDate(checkDate.getDate() - 1);
            while (logDates.has(toYYYYMMDD(checkDate))) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }
    }

    // --- Calculate Weekly Average ---
    const firstDay = new Date(sortedDates[0]);
    const totalDays = (new Date() - firstDay) / (1000 * 60 * 60 * 24);
    const totalWeeks = Math.max(1, totalDays / 7);
    const totalHoursAllTime = logs.reduce((sum, log) => sum + log.timeSpent, 0);
    const weeklyAverage = totalHoursAllTime / totalWeeks;

    res.status(200).json({
      totalWeeklyHours: parseFloat(totalWeeklyHours.toFixed(1)),
      weeklyAverage: parseFloat(weeklyAverage.toFixed(1)),
      currentStreak,
      longestStreak,
    });

  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

module.exports = router;
