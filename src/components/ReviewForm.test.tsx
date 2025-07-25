import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import ReviewForm from './ReviewForm';
import { useSession } from 'next-auth/react';

jest.mock('next-auth/react');

describe('ReviewForm', () => {
  it('renders without crashing', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '1', name: 'Tester' } },
      status: 'authenticated',
    });
    render(
      <ReviewForm
        bookingId="1"
        teacherId="2"
        lessonTitle="Sample Lesson"
        teacherName="Sample Teacher"
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    );
  });
}); 