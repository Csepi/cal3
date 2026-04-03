import request from 'supertest';
import { Event } from '../../src/entities/event.entity';
import { describeDockerBacked } from '../support/postgres-nest.harness';
import {
  OnboardedUserSession,
  registerAndCompleteOnboarding,
} from '../support/auth-onboarding.flow';

describeDockerBacked(
  'Task calendar bridge integration',
  ({ getHarness, isUnavailable, unavailabilityReason }) => {
    let sequence = 0;

    const nextSuffix = (prefix: string) => {
      sequence += 1;
      return `${prefix}-${String(sequence).padStart(2, '0')}`;
    };

    const getServer = () => {
      const harness = getHarness();
      expect(harness).not.toBeNull();
      if (!harness) {
        throw new Error('Harness was not initialized');
      }
      return harness.app.getHttpServer() as Parameters<typeof request>[0];
    };

    const createSession = async (
      prefix: string,
    ): Promise<OnboardedUserSession> => {
      const server = getServer();
      const suffix = nextSuffix(prefix);

      return registerAndCompleteOnboarding(server, {
        username: `${prefix}-register-${suffix}`,
        email: `${prefix}-${suffix}@example.com`,
        password: 'ValidPass#123',
        onboardingUsername: `${prefix}-user-${suffix}`,
        fingerprint: `${prefix}-fingerprint-${suffix}`,
      });
    };

    it('syncs task create/update/delete with mirrored calendar events', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const session = await createSession('task-bridge');

      const createdTaskResponse = await request(server)
        .post('/tasks')
        .set(session.authHeaders)
        .send({
          title: 'Bridge Task',
          body: 'Initial mirrored payload',
          color: '#16a34a',
          status: 'todo',
          priority: 'high',
          place: 'Focus Room',
          dueDate: '2031-04-01T09:00:00.000Z',
          dueEnd: '2031-04-01T10:30:00.000Z',
        })
        .expect(201);

      const taskId = createdTaskResponse.body.id as number;
      const eventId = createdTaskResponse.body.calendarEventId as number;

      expect(taskId).toEqual(expect.any(Number));
      expect(eventId).toEqual(expect.any(Number));

      await request(server)
        .get(`/events/${eventId}`)
        .set(session.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.id).toBe(eventId);
          expect(response.body.taskId).toBe(taskId);
          expect(response.body.title).toBe('Bridge Task');
          expect(response.body.location).toBe('Focus Room');
          expect(response.body.color).toBe('#16a34a');
          expect(response.body.isAllDay).toBe(false);
        });

      await request(server)
        .patch(`/tasks/${taskId}`)
        .set(session.authHeaders)
        .send({
          title: 'Bridge Task Updated',
          body: 'Updated mirrored payload',
          color: '#0ea5e9',
          place: 'Deep Work Zone',
          dueDate: '2031-04-01T11:00:00.000Z',
          dueEnd: '2031-04-01T12:00:00.000Z',
        })
        .expect(200);

      await request(server)
        .get(`/events/${eventId}`)
        .set(session.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.taskId).toBe(taskId);
          expect(response.body.title).toBe('Bridge Task Updated');
          expect(response.body.location).toBe('Deep Work Zone');
          expect(response.body.color).toBe('#0ea5e9');
        });

      await request(server)
        .delete(`/tasks/${taskId}`)
        .set(session.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.success).toBe(true);
        });

      await request(server)
        .get(`/events/${eventId}`)
        .set(session.authHeaders)
        .expect(404);
    });

    it('propagates event-side edits and deletions back to linked tasks', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const session = await createSession('task-event-sync');

      const createdTaskResponse = await request(server)
        .post('/tasks')
        .set(session.authHeaders)
        .send({
          title: 'Event Driven Task',
          body: 'Before event mutation',
          color: '#f59e0b',
          status: 'todo',
          priority: 'medium',
          place: 'Room One',
          dueDate: '2031-05-01T08:00:00.000Z',
          dueEnd: '2031-05-01T09:00:00.000Z',
        })
        .expect(201);

      const taskId = createdTaskResponse.body.id as number;
      const eventId = createdTaskResponse.body.calendarEventId as number;
      expect(eventId).toEqual(expect.any(Number));

      const harness = getHarness();
      expect(harness).not.toBeNull();
      if (!harness) {
        throw new Error('Harness was not initialized');
      }

      // Force a stale checksum so the bridge treats this as a user-originated event mutation.
      await harness.dataSource.getRepository(Event).update(eventId, {
        taskSyncChecksum: 'stale-checksum',
      });

      await request(server)
        .patch(`/events/${eventId}`)
        .set(session.authHeaders)
        .send({
          title: 'Event Mutated Title',
          color: '#7c3aed',
          location: 'Room Two',
          startDate: '2031-05-02',
          startTime: '13:15:00',
          endDate: '2031-05-02',
          endTime: '14:45:00',
          isAllDay: false,
        })
        .expect(200);

      await request(server)
        .get(`/tasks/${taskId}`)
        .set(session.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.id).toBe(taskId);
          expect(response.body.title).toBe('Event Mutated Title');
          expect(response.body.color).toBe('#7c3aed');
          expect(response.body.place).toBe('Room Two');
          expect(response.body.calendarEventId).toBe(eventId);
          expect(response.body.dueDate).toBeTruthy();
          expect(response.body.dueEnd).toBeTruthy();
          expect(
            new Date(response.body.dueDate).toISOString(),
          ).toBe('2031-05-02T13:15:00.000Z');
          expect(
            new Date(response.body.dueEnd).toISOString(),
          ).toBe('2031-05-02T14:45:00.000Z');
        });

      await request(server)
        .delete(`/events/${eventId}`)
        .set(session.authHeaders)
        .expect(200);

      await request(server)
        .get(`/tasks/${taskId}`)
        .set(session.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.id).toBe(taskId);
          expect(response.body.calendarEventId).toBeNull();
          expect(response.body.dueDate).toBeNull();
          expect(response.body.dueEnd).toBeNull();
        });
    });

    it('marks due-date-only tasks as all-day mirrored events', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const session = await createSession('task-all-day');

      const taskResponse = await request(server)
        .post('/tasks')
        .set(session.authHeaders)
        .send({
          title: 'All Day Task',
          dueDate: '2031-06-01T00:00:00.000Z',
          status: 'todo',
          priority: 'low',
        })
        .expect(201);

      const taskId = taskResponse.body.id as number;
      const eventId = taskResponse.body.calendarEventId as number;
      expect(taskId).toEqual(expect.any(Number));
      expect(eventId).toEqual(expect.any(Number));

      await request(server)
        .get(`/events/${eventId}`)
        .set(session.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.taskId).toBe(taskId);
          expect(response.body.isAllDay).toBe(true);
          expect(response.body.startTime).toBeNull();
          expect(response.body.endTime).toBeNull();
        });
    });
  },
);
