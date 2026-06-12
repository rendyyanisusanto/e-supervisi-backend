import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import periodRoutes from '../modules/periods/period.routes';
import subjectRoutes from '../modules/subjects/subject.routes';
import classroomRoutes from '../modules/classrooms/classroom.routes';
import teacherRoutes from '../modules/teachers/teacher.routes';
import instrumentRoutes from '../modules/instruments/instrument.routes';
import scoreRangeRoutes from '../modules/score-ranges/score-range.routes';
import settingsRoutes from '../modules/settings/settings.routes';
import waRoutes from '../modules/wa/wa.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import supervisionRoutes from '../modules/supervisions/supervision.routes';
import reflectionRoutes from '../modules/reflections/reflection.routes';
import reportRoutes from '../modules/reports/report.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'E-Supervisi SMK API is running', timestamp: new Date().toISOString() });
});

// Auth
router.use('/auth', authRoutes);

// Master data
router.use('/periods', periodRoutes);
router.use('/subjects', subjectRoutes);
router.use('/classrooms', classroomRoutes);
router.use('/teachers', teacherRoutes);
router.use('/instruments', instrumentRoutes);
router.use('/score-ranges', scoreRangeRoutes);

// Supervisi
router.use('/supervisions', supervisionRoutes);
router.use('/reflections', reflectionRoutes);

// Reports
router.use('/reports', reportRoutes);

// Settings
router.use('/settings', settingsRoutes);

// WA
router.use('/wa', waRoutes);

// Notifications
router.use('/notifications', notificationRoutes);

// Audit Logs
import auditLogRoutes from '../modules/audit-logs/audit-log.routes';
router.use('/audit-logs', auditLogRoutes);

export default router;
