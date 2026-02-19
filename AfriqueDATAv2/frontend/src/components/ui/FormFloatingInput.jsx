import { Form } from 'react-bootstrap';

/**
 * Champ avec étiquette flottante Bootstrap
 * Usage: <FormFloatingInput label="Email" type="email" value={...} onChange={...} />
 */
export default function FormFloatingInput({ label, error, invalid, id, className, ...props }) {
  const inputId = id || `floating-${Math.random().toString(36).slice(2)}`;
  return (
    <Form.Floating className={className}>
      <Form.Control
        id={inputId}
        isInvalid={invalid || !!error}
        placeholder=" "
        {...props}
      />
      <Form.Label htmlFor={inputId}>{label}</Form.Label>
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
    </Form.Floating>
  );
}
