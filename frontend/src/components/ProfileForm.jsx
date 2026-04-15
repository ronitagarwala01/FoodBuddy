import { useState } from 'react';

const GOALS = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'general_health', label: 'General Health' },
];

export default function ProfileForm({ onSubmit }) {
  const [form, setForm] = useState({
    age: '',
    heightFt: '',
    heightIn: '',
    weight: '',
    goal: 'weight_loss',
    budget: '',
  });
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.age || form.age < 10 || form.age > 120) e.age = 'Enter a valid age (10–120).';
    if (!form.heightFt || form.heightFt < 1 || form.heightFt > 9) e.heightFt = 'Enter feet (1–9).';
    if (form.heightIn === '' || form.heightIn < 0 || form.heightIn > 11) e.heightIn = 'Enter inches (0–11).';
    if (!form.weight || form.weight < 50 || form.weight > 700) e.weight = 'Enter weight in lbs (50–700).';
    if (!form.budget || form.budget < 10) e.budget = 'Enter a weekly budget (min $10).';
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const height = `${form.heightFt}'${form.heightIn}"`;
    onSubmit({
      age: Number(form.age),
      height,
      weight: `${form.weight} lbs`,
      goal: form.goal,
      budget: Number(form.budget),
    });
  }

  return (
    <div className="form-page">
      <div className="form-card">
        <div className="form-header">
          <div className="logo-icon">🥗</div>
          <h1>Meal Planner AI</h1>
          <p>Tell us about yourself and we'll build a personalized meal prep plan.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="age">Age</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="e.g. 28"
                  min={10}
                  max={120}
                  className={errors.age ? 'error' : ''}
                />
                <span className="input-unit">yrs</span>
              </div>
              {errors.age && <span className="field-error">{errors.age}</span>}
            </div>

            <div className="form-group">
              <label>Height</label>
              <div className="height-inputs">
                <div className="input-wrapper">
                  <input
                    type="number"
                    name="heightFt"
                    value={form.heightFt}
                    onChange={handleChange}
                    placeholder="5"
                    min={1}
                    max={9}
                    className={errors.heightFt ? 'error' : ''}
                  />
                  <span className="input-unit">ft</span>
                </div>
                <div className="input-wrapper">
                  <input
                    type="number"
                    name="heightIn"
                    value={form.heightIn}
                    onChange={handleChange}
                    placeholder="10"
                    min={0}
                    max={11}
                    className={errors.heightIn ? 'error' : ''}
                  />
                  <span className="input-unit">in</span>
                </div>
              </div>
              {(errors.heightFt || errors.heightIn) && (
                <span className="field-error">{errors.heightFt || errors.heightIn}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weight">Weight</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="e.g. 165"
                  min={50}
                  max={700}
                  className={errors.weight ? 'error' : ''}
                />
                <span className="input-unit">lbs</span>
              </div>
              {errors.weight && <span className="field-error">{errors.weight}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="budget">Weekly Budget</label>
              <div className="input-wrapper prefix">
                <span className="input-prefix">$</span>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  placeholder="e.g. 75"
                  min={10}
                  className={errors.budget ? 'error' : ''}
                />
              </div>
              {errors.budget && <span className="field-error">{errors.budget}</span>}
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="goal">Your Goal</label>
            <div className="goal-grid">
              {GOALS.map((g) => (
                <label
                  key={g.value}
                  className={`goal-option ${form.goal === g.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="goal"
                    value={g.value}
                    checked={form.goal === g.value}
                    onChange={handleChange}
                  />
                  <span className="goal-icon">{goalIcon(g.value)}</span>
                  <span>{g.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary">
            Build My Meal Plan →
          </button>
        </form>
      </div>
    </div>
  );
}

function goalIcon(goal) {
  const icons = {
    weight_loss: '🔥',
    muscle_gain: '💪',
    maintenance: '⚖️',
    general_health: '🌿',
  };
  return icons[goal] || '🍽️';
}
