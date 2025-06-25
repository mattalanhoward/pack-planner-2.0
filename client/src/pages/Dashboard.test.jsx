// src/pages/Dashboard.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import useAuth from '../hooks/useAuth';
import Dashboard from './Dashboard';

jest.mock('../hooks/useAuth', () => jest.fn());
jest.mock('../components/TopBar', () => props => (
  <div data-testid="topbar-mock">
    <button data-testid="viewmode-btn" onClick={() => props.setViewMode('list')}>
      SwitchView
    </button>
  </div>
));
jest.mock('../components/Sidebar', () => props => (
  <div data-testid="sidebar-mock">
    <button data-testid="rename-btn" onClick={props.onListRenamed}>Rename</button>
    <button data-testid="select-btn" onClick={() => props.onSelectList('list-1')}>Select</button>
    <button data-testid="add-btn" onClick={props.onItemAdded}>Add</button>
    <button data-testid="template-btn" onClick={props.onTemplateEdited}>Template</button>
  </div>
));
jest.mock('./GearListView', () => props => (
  <div data-testid="gearlist-mock">
    <span>listId: {props.listId}</span>
    <span>rename: {String(props.renameToggle)}</span>
    <span>refresh: {String(props.refreshToggle)}</span>
    <span>template: {String(props.templateToggle)}</span>
    <span>viewMode: {props.viewMode}</span>
  </div>
));

describe('Dashboard', () => {
  beforeEach(() => {
    useAuth.mockClear();
  });

  it('renders nothing when not authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, logout: jest.fn() });
    const { container } = render(<Dashboard />);
    expect(container.firstChild).toBeNull();
  });

  it('renders TopBar and Sidebar when authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, logout: jest.fn() });
    render(<Dashboard />);
    expect(screen.getByTestId('topbar-mock')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
  });

  it('shows placeholder message when no list selected', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, logout: jest.fn() });
    render(<Dashboard />);
    expect(screen.getByText('Select a gear list to begin.')).toBeInTheDocument();
  });

  it('renders GearListView when a list is selected and toggles props correctly', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, logout: jest.fn() });
    render(<Dashboard />);

    fireEvent.click(screen.getByTestId('select-btn'));
    expect(screen.getByTestId('gearlist-mock')).toBeInTheDocument();
    expect(screen.getByText('listId: list-1')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('rename-btn'));
    expect(screen.getByText('rename: true')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('rename-btn'));
    expect(screen.getByText('rename: false')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('add-btn'));
    expect(screen.getByText('refresh: true')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('template-btn'));
    expect(screen.getByText('template: true')).toBeInTheDocument();
  });

  it('allows changing view mode via TopBar', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, logout: jest.fn() });
    render(<Dashboard />);

    fireEvent.click(screen.getByTestId('viewmode-btn'));
    fireEvent.click(screen.getByTestId('select-btn'));
    expect(screen.getByText('viewMode: list')).toBeInTheDocument();
  });
});
