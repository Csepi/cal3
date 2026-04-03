import request from 'supertest';
import { Organisation } from '../../src/entities/organisation.entity';
import { Resource } from '../../src/entities/resource.entity';
import { ResourceType } from '../../src/entities/resource-type.entity';
import { ReservationStatus } from '../../src/entities/reservation.entity';
import { UsagePlan, User } from '../../src/entities/user.entity';
import { describeDockerBacked } from '../support/postgres-nest.harness';
import {
  OnboardedUserSession,
  registerAndCompleteOnboarding,
} from '../support/auth-onboarding.flow';

describeDockerBacked(
  'Task and reservation API integration',
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

    const grantReservationAccess = async (userId: number) => {
      const harness = getHarness();
      expect(harness).not.toBeNull();
      if (!harness) {
        throw new Error('Harness was not initialized');
      }

      await harness.userRepository.update(userId, {
        usagePlans: [UsagePlan.USER, UsagePlan.ENTERPRISE],
      });
    };

    const seedReservableResource = async (
      managingUserId: number,
      prefix: string,
    ) => {
      const harness = getHarness();
      expect(harness).not.toBeNull();
      if (!harness) {
        throw new Error('Harness was not initialized');
      }

      const suffix = nextSuffix(prefix);
      const organisationRepository =
        harness.dataSource.getRepository(Organisation);
      const resourceTypeRepository =
        harness.dataSource.getRepository(ResourceType);
      const resourceRepository = harness.dataSource.getRepository(Resource);
      const managingUser = await harness.userRepository.findOneByOrFail({
        id: managingUserId,
      });

      const organisation = await organisationRepository.save(
        organisationRepository.create({
          name: `Reservation Org ${suffix}`,
          description: 'Integration reservation organisation',
        }),
      );

      const resourceType = await resourceTypeRepository.save(
        resourceTypeRepository.create({
          name: `Room Type ${suffix}`,
          description: 'Integration reservation resource type',
          organisation,
          organisationId: organisation.id,
          color: '#f97316',
          minBookingDuration: 30,
        }),
      );

      const resource = await resourceRepository.save(
        resourceRepository.create({
          name: `Room ${suffix}`,
          description: 'Reservable integration resource',
          capacity: 2,
          organisation,
          organisationId: organisation.id,
          resourceType,
          managedBy: managingUser as User,
        }),
      );

      return { organisation, resourceType, resource };
    };

    it('covers task CRUD, filters, label mutation, and task ownership boundaries', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const ownerSession = await createSession('task-owner');
      const secondUserSession = await createSession('task-second-user');

      const ownerLabelResponse = await request(server)
        .post('/task-labels')
        .set(ownerSession.authHeaders)
        .send({
          name: 'Workflow',
          color: '#2563eb',
        })
        .expect(201);

      expect(ownerLabelResponse.body.id).toEqual(expect.any(Number));
      expect(ownerLabelResponse.body.name).toBe('Workflow');
      expect(ownerLabelResponse.body.color).toBe('#2563eb');
      expect(ownerLabelResponse.body.userId).toBe(ownerSession.userId);

      const secondaryLabelResponse = await request(server)
        .post('/task-labels')
        .set(ownerSession.authHeaders)
        .send({
          name: 'Urgent',
          color: '#dc2626',
        })
        .expect(201);

      expect(secondaryLabelResponse.body.id).toEqual(expect.any(Number));
      expect(secondaryLabelResponse.body.name).toBe('Urgent');

      const foreignLabelResponse = await request(server)
        .post('/task-labels')
        .set(secondUserSession.authHeaders)
        .send({
          name: 'External',
          color: '#16a34a',
        })
        .expect(201);

      const workflowLabelId = ownerLabelResponse.body.id as number;
      const urgentLabelId = secondaryLabelResponse.body.id as number;
      const foreignLabelId = foreignLabelResponse.body.id as number;

      await request(server)
        .get('/task-labels')
        .set(ownerSession.authHeaders)
        .expect(200)
        .expect((response) => {
          const labels = response.body as Array<{ id: number }>;
          expect(labels.map((label) => label.id)).toEqual(
            expect.arrayContaining([workflowLabelId, urgentLabelId]),
          );
        });

      await request(server)
        .patch(`/task-labels/${workflowLabelId}`)
        .set(ownerSession.authHeaders)
        .send({
          name: 'Workflow Updated',
          color: '#1d4ed8',
        })
        .expect(200)
        .expect((response) => {
          expect(response.body.id).toBe(workflowLabelId);
          expect(response.body.name).toBe('Workflow Updated');
          expect(response.body.color).toBe('#1d4ed8');
        });

      const primaryTaskResponse = await request(server)
        .post('/tasks')
        .set(ownerSession.authHeaders)
        .send({
          title: 'Workflow Task Alpha',
          body: 'Initial task body',
          status: 'todo',
          priority: 'medium',
          labelIds: [workflowLabelId],
        })
        .expect(201);

      expect(primaryTaskResponse.body.id).toEqual(expect.any(Number));
      expect(primaryTaskResponse.body.title).toBe('Workflow Task Alpha');
      expect(primaryTaskResponse.body.status).toBe('todo');
      expect(primaryTaskResponse.body.priority).toBe('medium');
      expect(primaryTaskResponse.body.ownerId).toBe(ownerSession.userId);
      expect(primaryTaskResponse.body.labels).toHaveLength(1);
      expect(primaryTaskResponse.body.labels[0].id).toBe(workflowLabelId);

      const primaryTaskId = primaryTaskResponse.body.id as number;

      const secondaryTaskResponse = await request(server)
        .post('/tasks')
        .set(ownerSession.authHeaders)
        .send({
          title: 'Workflow Task Beta',
          body: 'Completed task body',
          status: 'done',
          priority: 'low',
        })
        .expect(201);

      expect(secondaryTaskResponse.body.id).toEqual(expect.any(Number));
      expect(secondaryTaskResponse.body.status).toBe('done');

      const listResponse = await request(server)
        .get('/tasks')
        .set(ownerSession.authHeaders)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Number(listResponse.body.total)).toBe(2);
      expect(Number(listResponse.body.page)).toBe(1);
      expect(Number(listResponse.body.limit)).toBe(10);
      expect(listResponse.body.data).toHaveLength(2);
      expect(
        listResponse.body.data.map((task: { id: number }) => task.id),
      ).toEqual(
        expect.arrayContaining([
          primaryTaskId,
          secondaryTaskResponse.body.id as number,
        ]),
      );

      const filteredResponse = await request(server)
        .get('/tasks')
        .set(ownerSession.authHeaders)
        .query({
          status: 'todo',
          search: 'Alpha',
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(filteredResponse.body.total).toBe(1);
      expect(filteredResponse.body.data).toHaveLength(1);
      expect(filteredResponse.body.data[0].id).toBe(primaryTaskId);
      expect(filteredResponse.body.data[0].title).toBe('Workflow Task Alpha');

      const updateResponse = await request(server)
        .patch(`/tasks/${primaryTaskId}`)
        .set(ownerSession.authHeaders)
        .send({
          title: 'Workflow Task Alpha Updated',
          body: 'Updated task body',
          status: 'in_progress',
          priority: 'high',
          labelIds: [urgentLabelId],
        })
        .expect(200);

      expect(updateResponse.body.id).toBe(primaryTaskId);
      expect(updateResponse.body.title).toBe('Workflow Task Alpha Updated');
      expect(updateResponse.body.body).toBe('Updated task body');
      expect(updateResponse.body.status).toBe('in_progress');
      expect(updateResponse.body.priority).toBe('high');
      expect(updateResponse.body.labels).toHaveLength(1);
      expect(updateResponse.body.labels[0].id).toBe(urgentLabelId);

      const addLabelResponse = await request(server)
        .post(`/tasks/${primaryTaskId}/labels`)
        .set(ownerSession.authHeaders)
        .send({
          labelIds: [workflowLabelId],
        })
        .expect(201);

      expect(addLabelResponse.body.id).toBe(primaryTaskId);
      expect(addLabelResponse.body.labels).toHaveLength(2);
      expect(
        addLabelResponse.body.labels.map((label: { id: number }) => label.id),
      ).toEqual(expect.arrayContaining([workflowLabelId, urgentLabelId]));

      const labelFilterResponse = await request(server)
        .get('/tasks')
        .set(ownerSession.authHeaders)
        .query({
          search: 'Alpha Updated',
          labelIds: [workflowLabelId, urgentLabelId],
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(labelFilterResponse.body.total).toBe(1);
      expect(labelFilterResponse.body.data).toHaveLength(1);
      expect(labelFilterResponse.body.data[0].id).toBe(primaryTaskId);

      const removeLabelResponse = await request(server)
        .delete(`/tasks/${primaryTaskId}/labels/${workflowLabelId}`)
        .set(ownerSession.authHeaders)
        .expect(200);

      expect(removeLabelResponse.body.id).toBe(primaryTaskId);
      expect(removeLabelResponse.body.labels).toHaveLength(1);
      expect(removeLabelResponse.body.labels[0].id).toBe(urgentLabelId);

      await request(server)
        .patch(`/tasks/${primaryTaskId}`)
        .set(ownerSession.authHeaders)
        .send({
          labelIds: [foreignLabelId],
        })
        .expect(403);

      await request(server)
        .get(`/tasks/${primaryTaskId}`)
        .set(secondUserSession.authHeaders)
        .expect(404);

      await request(server)
        .patch(`/tasks/${primaryTaskId}`)
        .set(secondUserSession.authHeaders)
        .send({
          title: 'Should not update',
        })
        .expect(404);

      await request(server)
        .post(`/tasks/${primaryTaskId}/labels`)
        .set(secondUserSession.authHeaders)
        .send({
          labelIds: [foreignLabelId],
        })
        .expect(404);

      await request(server)
        .delete(`/tasks/${secondaryTaskResponse.body.id as number}`)
        .set(ownerSession.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.success).toBe(true);
        });

      await request(server)
        .get(`/tasks/${secondaryTaskResponse.body.id as number}`)
        .set(ownerSession.authHeaders)
        .expect(404);

      await request(server)
        .delete(`/task-labels/${urgentLabelId}`)
        .set(ownerSession.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.success).toBe(true);
        });
    });

    it('enforces reservation plan restrictions and exercises the successful reservation path', async () => {
      if (isUnavailable()) {
        expect(unavailabilityReason()).toBeTruthy();
        return;
      }

      const server = getServer();
      const restrictedSession = await createSession('reservation-restricted');

      const restrictedResponse = await request(server)
        .get('/reservations')
        .set(restrictedSession.authHeaders)
        .expect(403);

      expect(restrictedResponse.body.statusCode).toBe(403);
      expect(restrictedResponse.body.message).toBeTruthy();

      const enterpriseSession = await createSession('reservation-enterprise');
      await grantReservationAccess(enterpriseSession.userId);
      const { resource } = await seedReservableResource(
        enterpriseSession.userId,
        'reservation-resource',
      );

      const createReservationResponse = await request(server)
        .post('/reservations')
        .set(enterpriseSession.authHeaders)
        .send({
          resourceId: resource.id,
          startTime: '2030-02-01T09:00:00.000Z',
          endTime: '2030-02-01T10:00:00.000Z',
          quantity: 1,
          notes: 'Integration reservation',
          customerInfo: {
            name: 'Integration User',
            email: 'integration@example.com',
          },
        })
        .expect(201);

      expect(createReservationResponse.body.id).toEqual(expect.any(Number));
      expect(createReservationResponse.body.quantity).toBe(1);
      expect(createReservationResponse.body.status).toBe(
        ReservationStatus.PENDING,
      );
      expect(createReservationResponse.body.notes).toBe(
        'Integration reservation',
      );
      expect(createReservationResponse.body.resource?.id).toBe(resource.id);
      expect(createReservationResponse.body.createdBy?.id).toBe(
        enterpriseSession.userId,
      );

      const reservationId = createReservationResponse.body.id as number;

      const listReservationsResponse = await request(server)
        .get('/reservations')
        .set(enterpriseSession.authHeaders)
        .query({ resourceId: resource.id })
        .expect(200);

      expect(Array.isArray(listReservationsResponse.body)).toBe(true);
      expect(listReservationsResponse.body).toHaveLength(1);
      expect(listReservationsResponse.body[0].id).toBe(reservationId);
      expect(listReservationsResponse.body[0].resource?.id).toBe(resource.id);

      await request(server)
        .get(`/reservations/${reservationId}`)
        .set(enterpriseSession.authHeaders)
        .expect(200)
        .expect((response) => {
          expect(response.body.id).toBe(reservationId);
          expect(response.body.resource?.id).toBe(resource.id);
        });

      const updateReservationResponse = await request(server)
        .patch(`/reservations/${reservationId}`)
        .set(enterpriseSession.authHeaders)
        .send({
          quantity: 2,
          status: ReservationStatus.CONFIRMED,
          notes: 'Reservation confirmed',
        })
        .expect(200);

      expect(updateReservationResponse.body.id).toBe(reservationId);
      expect(updateReservationResponse.body.quantity).toBe(2);
      expect(updateReservationResponse.body.status).toBe(
        ReservationStatus.CONFIRMED,
      );
      expect(updateReservationResponse.body.notes).toBe(
        'Reservation confirmed',
      );

      const deleteReservationResponse = await request(server)
        .delete(`/reservations/${reservationId}`)
        .set(enterpriseSession.authHeaders)
        .expect(200);

      expect(deleteReservationResponse.body.message).toBeTruthy();

      await request(server)
        .get(`/reservations/${reservationId}`)
        .set(enterpriseSession.authHeaders)
        .expect(404);
    });
  },
);
