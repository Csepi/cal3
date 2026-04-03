import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReservationFormModal } from '../../components/reservation/ReservationFormModal';
import type { ReservationResource } from '../../types/reservation';

jest.mock('../../i18n', () => ({
  tStatic: (key: string, options?: { defaultValue?: string }) =>
    options?.defaultValue ?? key,
}));

jest.mock('../../i18n/useAppTranslation', () => ({
  useAppTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
    i18n: { language: 'en', resolvedLanguage: 'en' },
  }),
}));

describe('ReservationFormModal integration', () => {
  const resources: ReservationResource[] = [
    {
      id: 11,
      name: 'Conference Room A',
      resourceType: {
        id: 4,
        name: 'Meeting Room',
      },
    },
  ];

  it('shows validation errors for invalid single-day ranges', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);

    const { container } = render(
      <ReservationFormModal
        isOpen
        onClose={jest.fn()}
        onSave={onSave}
        resources={resources}
        themeColor="#0ea5e9"
      />,
    );

    const dateTimeInputs = container.querySelectorAll(
      'input[type="datetime-local"]',
    );
    expect(dateTimeInputs.length).toBe(2);

    fireEvent.change(dateTimeInputs[0], {
      target: { value: '2031-01-15T10:00' },
    });
    fireEvent.change(dateTimeInputs[1], {
      target: { value: '2031-01-15T09:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Reservation' }));

    await waitFor(() => {
      expect(screen.getByText('End time must be after start time')).toBeVisible();
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits multi-day reservation payloads through the modal flow', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);

    const { container } = render(
      <ReservationFormModal
        isOpen
        onClose={jest.fn()}
        onSave={onSave}
        resources={resources}
        themeColor="#0ea5e9"
      />,
    );

    const multiDayToggle = container.querySelector(
      '#isMultiDay',
    ) as HTMLInputElement | null;
    expect(multiDayToggle).not.toBeNull();
    fireEvent.click(multiDayToggle as HTMLInputElement);

    const dateInputs = container.querySelectorAll('input[type="date"]');
    const timeInputs = container.querySelectorAll('input[type="time"]');
    expect(dateInputs.length).toBe(2);
    expect(timeInputs.length).toBe(2);

    fireEvent.change(dateInputs[0], { target: { value: '2031-01-20' } });
    fireEvent.change(dateInputs[1], { target: { value: '2031-01-21' } });
    fireEvent.change(timeInputs[0], { target: { value: '09:00' } });
    fireEvent.change(timeInputs[1], { target: { value: '12:30' } });

    const quantityInput = container.querySelector(
      'input[type="number"]',
    ) as HTMLInputElement | null;
    expect(quantityInput).not.toBeNull();
    fireEvent.change(quantityInput as HTMLInputElement, {
      target: { value: '2' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Reservation' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceId: 11,
        quantity: 2,
        startDate: '2031-01-20',
        endDate: '2031-01-21',
        startTimeOnly: '09:00',
        endTimeOnly: '12:30',
      }),
    );
  });
});
