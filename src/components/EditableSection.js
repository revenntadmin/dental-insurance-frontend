import { useState } from 'react';
import { getErrorMessage } from '../lib/apiError';

/**
 * A card that shows its fields read-only until the user clicks Edit. Each section
 * owns its edit state, so several can sit on one page and be saved independently.
 *
 * `children` is a render function receiving `{ editing }` — pass it to the
 * `disabled` prop of the controls inside. `onSave` may return a success message
 * and should throw to surface an error. `bodyClassName` may be a function of
 * `editing` for sections that swap layout between reading and editing.
 *
 * `variant="row"` drops the card chrome so several editable groups can share one
 * card; `title` then takes a node (a badge, say) instead of a string.
 *
 * Passing `onDelete` adds a delete action inside edit mode, behind a confirm step.
 */
export default function EditableSection({
  title,
  description,
  editable = true,
  bodyClassName = 'form-grid',
  variant = 'card',
  deleteLabel = 'Delete',
  deleteConfirmMessage = 'This cannot be undone.',
  onSave,
  onCancel,
  onDelete,
  children,
}) {
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function startEditing() {
    setError('');
    setMessage('');
    setEditing(true);
  }

  function cancelEditing() {
    setError('');
    setMessage('');
    setEditing(false);
    setConfirmingDelete(false);
    onCancel?.();
  }

  async function handleDelete() {
    setError('');
    setSubmitting(true);
    try {
      await onDelete();
      // On success the caller removes this section, so there is nothing to reset.
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete'));
      setConfirmingDelete(false);
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const result = await onSave();
      setEditing(false);
      setMessage(result || 'Changes saved.');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save changes'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={variant === 'row' ? 'editable-row' : 'section-card'}>
      <div className="section-card__header">
        {typeof title === 'string' ? <h2 className="section-card__title">{title}</h2> : title}
        {editable && !editing && (
          <button type="button" className="section-card__edit" onClick={startEditing}>
            Edit
          </button>
        )}
      </div>

      {description && <p className="form-hint">{description}</p>}

      <form onSubmit={handleSubmit}>
        <div className={typeof bodyClassName === 'function' ? bodyClassName(editing) : bodyClassName}>
          {children({ editing })}
        </div>

        {error && <p className="form-error section-card__message">{error}</p>}
        {message && <p className="form-success section-card__message">{message}</p>}

        {editing && (
          <div className="section-card__actions">
            {confirmingDelete ? (
              <>
                <span className="section-card__confirm">{deleteConfirmMessage}</span>
                <button
                  type="button"
                  className="button-danger"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  {submitting ? 'Deleting...' : `Yes, ${deleteLabel.toLowerCase()}`}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={submitting}
                >
                  Keep
                </button>
              </>
            ) : (
              <>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={cancelEditing}
                  disabled={submitting}
                >
                  Cancel
                </button>
                {onDelete && (
                  <button
                    type="button"
                    className="button-danger section-card__delete"
                    onClick={() => setConfirmingDelete(true)}
                    disabled={submitting}
                  >
                    {deleteLabel}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
