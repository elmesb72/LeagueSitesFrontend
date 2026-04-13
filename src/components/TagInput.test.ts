import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import TagInput from './TagInput.svelte';

describe('TagInput', () => {
	test('renders existing tags from value', () => {
		render(TagInput, { props: { value: 'a@test.com,b@test.com' } });
		expect(screen.getByText('a@test.com')).toBeInTheDocument();
		expect(screen.getByText('b@test.com')).toBeInTheDocument();
	});

	test('renders input field when not disabled', () => {
		const { container } = render(TagInput, { props: { value: '' } });
		expect(container.querySelector('.tag-input-field')).not.toBeNull();
	});

	test('hides input field when disabled', () => {
		const { container } = render(TagInput, { props: { value: 'a@test.com', disabled: true } });
		expect(container.querySelector('.tag-input-field')).toBeNull();
	});

	test('hides remove buttons when disabled', () => {
		const { container } = render(TagInput, { props: { value: 'a@test.com', disabled: true } });
		expect(container.querySelector('.tag-remove')).toBeNull();
	});

	test('shows remove buttons when not disabled', () => {
		const { container } = render(TagInput, { props: { value: 'a@test.com' } });
		expect(container.querySelector('.tag-remove')).not.toBeNull();
	});

	test('shows placeholder when no tags', () => {
		render(TagInput, { props: { value: '' } });
		const input = screen.getByPlaceholderText(/Type and press/);
		expect(input).toBeInTheDocument();
	});

	test('hides placeholder when tags exist', () => {
		const { container } = render(TagInput, { props: { value: 'a@test.com' } });
		const input = container.querySelector('.tag-input-field') as HTMLInputElement;
		expect(input?.placeholder).toBe('');
	});

	test('has disabled styling when disabled', () => {
		const { container } = render(TagInput, { props: { value: '', disabled: true } });
		expect(container.querySelector('.tag-input-disabled')).not.toBeNull();
	});
});
