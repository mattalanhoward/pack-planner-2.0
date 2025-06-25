// src/App.test.jsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import useAuth from './hooks/useAuth';

// Suppress React Router Future Flag warnings in tests
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

// Mock API import to avoid import.meta in tests
jest.mock('./services/api', () => ({
  __esModule: true,
  default: {},
}));

// Mock authentication hook and page components
jest.mock('./hooks/useAuth');
jest.mock('./pages/Login', () => () => <div data-testid="login-page" />);
jest.mock('./pages/Dashboard', () => () => <div data-testid="dashboard-page" />);
jest.mock('./pages/GearListView', () => () => <div data-testid="gearlist-page" />);

describe('App routing', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders Login at /login regardless of auth', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('redirects to login when accessing /dashboard unauthenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders Dashboard at /dashboard when authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('redirects to login when accessing /lists/:id unauthenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    render(
      <MemoryRouter initialEntries={['/lists/123']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders GearListView at /lists/:id when authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    render(
      <MemoryRouter initialEntries={['/lists/abc']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('gearlist-page')).toBeInTheDocument();
  });

  it('wildcard route redirects to /dashboard then to login if unauthenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    render(
      <MemoryRouter initialEntries={['/nope']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('wildcard route redirects to /dashboard when authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    render(
      <MemoryRouter initialEntries={['/nothing-here']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });
});
