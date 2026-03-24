import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PianoKeyboard from '../PianoKeyboard';

describe('PianoKeyboard', () => {
  it('renders the keyboard', () => {
    render(<PianoKeyboard activeNotes={new Set()} />);
    expect(screen.getByTestId('piano-keyboard')).toBeInTheDocument();
  });

  it('renders 88 key buttons', () => {
    render(<PianoKeyboard activeNotes={new Set()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(88);
  });

  it('highlights active notes', () => {
    const activeNotes = new Set([60]); // Middle C
    render(<PianoKeyboard activeNotes={activeNotes} />);
    const key = screen.getByLabelText('C4');
    expect(key).toBeInTheDocument();
    // Active note should have highlight color
    expect(key.style.backgroundColor).toBeTruthy();
  });

  it('calls onNoteOn when clicking a key', () => {
    const onNoteOn = vi.fn();
    render(<PianoKeyboard activeNotes={new Set()} onNoteOn={onNoteOn} />);
    const key = screen.getByLabelText('C4');
    fireEvent.pointerDown(key);
    expect(onNoteOn).toHaveBeenCalledWith(60);
  });

  it('calls onNoteOff when releasing a key', () => {
    const onNoteOff = vi.fn();
    render(<PianoKeyboard activeNotes={new Set()} onNoteOff={onNoteOff} />);
    const key = screen.getByLabelText('C4');
    fireEvent.pointerUp(key);
    expect(onNoteOff).toHaveBeenCalledWith(60);
  });
});
