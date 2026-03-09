import React from 'react';
import { render, screen } from '@testing-library/react';
import AppErrorBoundary from '../components/common/AppErrorBoundary';

const Boom: React.FC = () => {
  throw new Error('boom');
};

describe('AppErrorBoundary', () => {
  it('renders fallback UI when child throws', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AppErrorBoundary fallbackTitle="Module crashed" inline>
        <Boom />
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Module crashed')).toBeTruthy();
    expect(
      screen.getByText(
        'The application hit an unexpected error. The incident was logged automatically.',
      ),
    ).toBeTruthy();

    spy.mockRestore();
  });
});
