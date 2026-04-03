import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupManagementModal } from '../components/calendar/groups/GroupManagementModal';

jest.mock('../i18n', () => ({
  tStatic: (key: string, options?: { defaultValue?: string }) =>
    options?.defaultValue ?? key,
}));

jest.mock('../i18n/useAppTranslation', () => ({
  useAppTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? _key,
  }),
}));

describe('GroupManagementModal integration flow', () => {
  it('validates minimum group name length before submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <GroupManagementModal
        isOpen
        mode="create"
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />,
    );

    const nameInput = screen.getByPlaceholderText(
      /Engineering, Personal, Family/i,
    );
    await user.clear(nameInput);
    await user.type(nameInput, 'A');
    await user.click(screen.getByRole('button', { name: /Create group/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText(/at least 2 characters long/i),
    ).toBeInTheDocument();
  });

  it('submits trimmed payload with visibility flag', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <GroupManagementModal
        isOpen
        mode="create"
        initialVisible
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />,
    );

    const nameInput = screen.getByPlaceholderText(
      /Engineering, Personal, Family/i,
    );
    await user.clear(nameInput);
    await user.type(nameInput, '  Team Ops  ');

    const visibleToggle = screen.getByRole('checkbox');
    await user.click(visibleToggle);

    await user.click(screen.getByRole('button', { name: /Create group/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Team Ops',
      isVisible: false,
    });
  });
});
