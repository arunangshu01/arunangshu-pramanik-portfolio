import { render, screen } from '@testing-library/react';
import App from './App';

test('renders portfolio sections', async () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /About/i })).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: /Skills/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /^Projects$/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /^Projects$/i })).toHaveAttribute('href', '#projects');
  expect(screen.getByRole('heading', { name: /Experience/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Education/i })).toBeInTheDocument();
});
