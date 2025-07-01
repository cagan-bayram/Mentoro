import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import ReviewForm from './ReviewForm';

describe('ReviewForm', () => {
  it('renders without crashing', () => {
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