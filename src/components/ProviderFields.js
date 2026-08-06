/** The provider form, shared by the add form and each editable row. */
export default function ProviderFields({ form, onChange, idPrefix, disabled = false }) {
  return (
    <>
      <div className="form-field">
        <label htmlFor={`${idPrefix}-name`}>Name</label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
          disabled={disabled}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor={`${idPrefix}-npi`}>NPI</label>
        <input
          id={`${idPrefix}-npi`}
          type="text"
          inputMode="numeric"
          value={form.npi}
          onChange={(e) => onChange('npi', e.target.value)}
          disabled={disabled}
        />
        <p className="form-hint">
          The provider&apos;s individual (Type 1) NPI — ten digits.
        </p>
      </div>

      <div className="form-field">
        <label htmlFor={`${idPrefix}-specialty`}>Specialty</label>
        <input
          id={`${idPrefix}-specialty`}
          type="text"
          value={form.specialty}
          onChange={(e) => onChange('specialty', e.target.value)}
          disabled={disabled}
        />
      </div>
    </>
  );
}
