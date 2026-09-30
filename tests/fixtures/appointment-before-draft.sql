BEGIN;
INSERT INTO "Appointment" (id, "serviceId", "startAt", "endAt", "calendarUid", "firstName", "lastName", email, phone, "serviceName", "serviceDescription", "durationMinutes", "meetingMode", "phoneDirection", "updatedAt")
VALUES ('draft-upgrade-appointment', 'availability-upgrade-service', '2026-10-05T07:00:00Z', '2026-10-05T07:30:00Z', 'draft-upgrade-calendar', 'Synthetic', 'Customer', 'upgrade@example.test', '123', 'Preserved snapshot', '', 30, 'PHONE', 'ADVISOR_CALLS_CLIENT', CURRENT_TIMESTAMP);
INSERT INTO "AppointmentParticipant" (id, "appointmentId", "advisorProfileId", role, "profileName", "profileTitle") VALUES ('draft-upgrade-participant', 'draft-upgrade-appointment', 'availability-upgrade-profile', 'PRIMARY', 'Synthetic', 'Advisor');
INSERT INTO "AppointmentReservation" (id, "appointmentId", "advisorProfileId", "startAt", "endAt") VALUES ('draft-upgrade-reservation', 'draft-upgrade-appointment', 'availability-upgrade-profile', '2026-10-05T07:00:00Z', '2026-10-05T07:30:00Z');
COMMIT;
