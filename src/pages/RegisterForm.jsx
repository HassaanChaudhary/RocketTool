import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// ─── ZOD VALIDATION SCHEMA ─────────────────────────────────────────────────────

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const registrationSchema = z
  .object({
    // Identity
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be 50 characters or fewer'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be 50 characters or fewer'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be 30 characters or fewer')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username may only contain letters, numbers, and underscores'
      ),

    // Authentication
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
      .regex(/[0-9]/, 'Password must include at least one number')
      .regex(
        /[^a-zA-Z0-9]/,
        'Password must include at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\+?[0-9\s\-()]{7,20}$/.test(val),
        'Enter a valid phone number'
      ),

    // Profile
    profilePicture: z
      .any()
      .optional()
      .refine(
        (file) => !file || file.size <= MAX_FILE_SIZE,
        'File size must be less than 5 MB'
      )
      .refine(
        (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
        'Only .jpg, .png, .gif, and .webp files are accepted'
      ),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    country: z.string().min(1, 'Country is required'),

    // Preferences
    language: z.string().min(1, 'Language is required'),
    timezone: z.string().min(1, 'Timezone is required'),
    notifications: z
      .object({
        email: z.boolean(),
        sms: z.boolean(),
        push: z.boolean(),
      })
      // At least one notification channel must be selected
      .refine((n) => n.email || n.sms || n.push, {
        message: 'Select at least one notification preference',
      }),
    interests: z
      .array(z.string())
      .max(5, 'You can select up to 5 interests')
      .optional()
      .default([]),

    // Legal
    acceptTos: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms of Service' }),
    }),
    acceptPrivacy: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Privacy Policy' }),
    }),
    marketingOptIn: z.boolean().optional().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ─── STATIC DATA ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina',
  'Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados',
  'Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana',
  'Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon',
  'Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo',
  'Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica',
  'Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia',
  'Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana',
  'Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary',
  'Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan',
  'Jordan','Kazakhstan','Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia',
  'Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar',
  'Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius',
  'Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique',
  'Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria',
  'North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama',
  'Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania',
  'Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines',
  'Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles',
  'Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa',
  'South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland',
  'Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga',
  'Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu',
  'Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
]

const LANGUAGES = [
  'English','French','Spanish','German','Arabic','Chinese','Hindi','Portuguese',
  'Russian','Japanese','Korean','Italian','Dutch','Turkish','Swedish','Polish',
]

// Subset of common IANA timezones grouped for usability
const TIMEZONES = Intl.supportedValuesOf
  ? Intl.supportedValuesOf('timeZone')
  : [
      'UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
      'America/Sao_Paulo','Europe/London','Europe/Paris','Europe/Berlin','Europe/Moscow',
      'Asia/Dubai','Asia/Kolkata','Asia/Shanghai','Asia/Tokyo','Asia/Seoul',
      'Australia/Sydney','Pacific/Auckland','Africa/Cairo','Africa/Lagos',
    ]

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

const INTEREST_OPTIONS = [
  'Technology','Science','Sports','Music','Art','Travel','Food','Gaming',
  'Fashion','Photography','Fitness','Reading','Movies','Nature','Business',
]

// ─── HELPER: PASSWORD STRENGTH ──────────────────────────────────────────────────

/**
 * Computes a rough password strength score (0-4) based on length, character
 * variety, and common patterns. Returns { score, label, color }.
 */
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-500' }
  return { score, label: 'Strong', color: 'bg-green-500' }
}

// ─── HELPER: RANDOM TEST DEFAULTS ───────────────────────────────────────────────

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateTestDefaults() {
  const firstNames = ['Alice','Bob','Carlos','Diana','Ethan','Fatima','George','Hannah','Ivan','Julia']
  const lastNames = ['Smith','Johnson','García','Müller','Chen','Nguyen','Kim','Petrov','Singh','Ali']
  const domains = ['example.com','test.io','demo.org','mail.dev']
  const first = randomItem(firstNames)
  const last = randomItem(lastNames)
  const username = `${first.toLowerCase()}_${last.toLowerCase()}${Math.floor(Math.random() * 999)}`
  const pw = 'Test@1234'
  return {
    firstName: first,
    lastName: last,
    email: `${username}@${randomItem(domains)}`,
    username,
    password: pw,
    confirmPassword: pw,
    phone: `+1${String(Math.floor(2000000000 + Math.random() * 8000000000))}`,
    profilePicture: undefined,
    dateOfBirth: `${1980 + Math.floor(Math.random() * 30)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    gender: randomItem(GENDERS),
    country: randomItem(COUNTRIES),
    language: randomItem(LANGUAGES),
    timezone: randomItem(TIMEZONES),
    notifications: { email: true, sms: Math.random() > 0.5, push: Math.random() > 0.5 },
    interests: INTEREST_OPTIONS.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 1),
    acceptTos: true,
    acceptPrivacy: true,
    marketingOptIn: Math.random() > 0.5,
  }
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────────

export default function RegisterForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: generateTestDefaults(),
  })

  const password = watch('password')
  const strength = getPasswordStrength(password)

  // Live preview for profile picture
  const [previewUrl, setPreviewUrl] = useState(null)

  // Cleanup object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function handleProfilePicture(e, onChange) {
    const file = e.target.files?.[0] ?? undefined
    onChange(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  async function onFormSubmit(data) {
    await onSubmit(data)
  }

  // ── Reusable tiny components ─────────────────────────────────────────────

  function FieldError({ error }) {
    if (!error) return null
    return (
      <p role="alert" className="mt-1 text-sm text-red-500">
        {error.message}
      </p>
    )
  }

  const inputClass = (hasError) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition
     focus:ring-2 focus:ring-blue-500
     ${hasError ? 'border-red-500' : 'border-gray-300'}`

  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      noValidate
      className="mx-auto max-w-2xl space-y-10 rounded-2xl bg-white p-6 shadow-lg sm:p-10"
    >
      <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>

      {/* ── 1. IDENTITY ──────────────────────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-800">Identity</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* First name */}
          <div>
            <label htmlFor="firstName" className={labelClass}>
              First name <span className="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              className={inputClass(errors.firstName)}
              {...register('firstName')}
            />
            <FieldError error={errors.firstName} />
          </div>

          {/* Last name */}
          <div>
            <label htmlFor="lastName" className={labelClass}>
              Last name <span className="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              className={inputClass(errors.lastName)}
              {...register('lastName')}
            />
            <FieldError error={errors.lastName} />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className={labelClass}>
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClass(errors.email)}
            {...register('email')}
          />
          <FieldError error={errors.email} />
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className={labelClass}>
            Username <span className="text-red-500">*</span>
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            className={inputClass(errors.username)}
            {...register('username')}
          />
          <FieldError error={errors.username} />
        </div>
      </fieldset>

      {/* ── 2. AUTHENTICATION ────────────────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-800">Authentication</legend>

        {/* Password */}
        <div>
          <label htmlFor="password" className={labelClass}>
            Password <span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={inputClass(errors.password)}
            {...register('password')}
          />
          {/* Password strength indicator */}
          {password && (
            <div className="mt-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full transition-all ${strength.color}`}
                  style={{ width: `${(strength.score / 5) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-600">
                Strength: <span className="font-medium">{strength.label}</span>
              </p>
            </div>
          )}
          <FieldError error={errors.password} />
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm password <span className="text-red-500">*</span>
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={inputClass(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
          <FieldError error={errors.confirmPassword} />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone number <span className="text-gray-400">(optional — used for 2FA)</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            className={inputClass(errors.phone)}
            {...register('phone')}
          />
          <FieldError error={errors.phone} />
        </div>
      </fieldset>

      {/* ── 3. PROFILE SETUP ─────────────────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-800">Profile Setup</legend>

        {/* Profile picture */}
        <div>
          <label htmlFor="profilePicture" className={labelClass}>
            Profile picture <span className="text-gray-400">(optional)</span>
          </label>
          <Controller
            name="profilePicture"
            control={control}
            render={({ field: { onChange, ref } }) => (
              <input
                id="profilePicture"
                type="file"
                accept="image/*"
                ref={ref}
                onChange={(e) => handleProfilePicture(e, onChange)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />
            )}
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Profile preview"
              className="mt-3 h-24 w-24 rounded-full border object-cover"
            />
          )}
          <FieldError error={errors.profilePicture} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Date of birth */}
          <div>
            <label htmlFor="dateOfBirth" className={labelClass}>
              Date of birth <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="dateOfBirth"
              type="date"
              className={inputClass(errors.dateOfBirth)}
              {...register('dateOfBirth')}
            />
            <FieldError error={errors.dateOfBirth} />
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className={labelClass}>
              Gender <span className="text-gray-400">(optional)</span>
            </label>
            <select
              id="gender"
              className={inputClass(errors.gender)}
              {...register('gender')}
            >
              <option value="">Select…</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <FieldError error={errors.gender} />
          </div>
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className={labelClass}>
            Country <span className="text-red-500">*</span>
          </label>
          <select
            id="country"
            className={inputClass(errors.country)}
            {...register('country')}
          >
            <option value="">Select a country…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <FieldError error={errors.country} />
        </div>
      </fieldset>

      {/* ── 4. PREFERENCES ───────────────────────────────────────────────── */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-800">Preferences</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Language */}
          <div>
            <label htmlFor="language" className={labelClass}>
              Language <span className="text-red-500">*</span>
            </label>
            <select
              id="language"
              className={inputClass(errors.language)}
              {...register('language')}
            >
              <option value="">Select…</option>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <FieldError error={errors.language} />
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className={labelClass}>
              Timezone <span className="text-red-500">*</span>
            </label>
            <select
              id="timezone"
              className={inputClass(errors.timezone)}
              {...register('timezone')}
            >
              <option value="">Select…</option>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <FieldError error={errors.timezone} />
          </div>
        </div>

        {/* Notification preferences */}
        <div>
          <span className={labelClass}>
            Notifications <span className="text-red-500">*</span>
          </span>
          <div className="mt-1 flex flex-wrap gap-4">
            {(['email', 'sms', 'push']).map((channel) => (
              <label key={channel} className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  {...register(`notifications.${channel}`)}
                />
                {channel.charAt(0).toUpperCase() + channel.slice(1)}
              </label>
            ))}
          </div>
          {/* The notification refine error surfaces on the notifications object */}
          <FieldError error={errors.notifications} />
        </div>

        {/* Interests — tag-style multi-select with a 5-item cap */}
        <div>
          <span className={labelClass}>
            Interests <span className="text-gray-400">(optional, up to 5)</span>
          </span>
          <Controller
            name="interests"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="mt-1 flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = value.includes(interest)
                  const disabled = !selected && value.length >= 5
                  return (
                    <button
                      key={interest}
                      type="button"
                      disabled={disabled}
                      aria-pressed={selected}
                      onClick={() => {
                        if (selected) {
                          onChange(value.filter((v) => v !== interest))
                        } else if (value.length < 5) {
                          onChange([...value, interest])
                        }
                      }}
                      className={`rounded-full border px-3 py-1 text-sm transition
                        ${
                          selected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                        }
                        ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                    >
                      {interest}
                    </button>
                  )
                })}
              </div>
            )}
          />
          <FieldError error={errors.interests} />
        </div>
      </fieldset>

      {/* ── 5. LEGAL ─────────────────────────────────────────────────────── */}
      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold text-gray-800">Legal</legend>

        {/* Terms of Service */}
        <div>
          <label className="inline-flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register('acceptTos')}
            />
            <span>
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>{' '}
              <span className="text-red-500">*</span>
            </span>
          </label>
          <FieldError error={errors.acceptTos} />
        </div>

        {/* Privacy Policy */}
        <div>
          <label className="inline-flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register('acceptPrivacy')}
            />
            <span>
              I agree to the{' '}
              <a href="/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>{' '}
              <span className="text-red-500">*</span>
            </span>
          </label>
          <FieldError error={errors.acceptPrivacy} />
        </div>

        {/* Marketing opt-in */}
        <div>
          <label className="inline-flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register('marketingOptIn')}
            />
            <span>I'd like to receive marketing emails (optional)</span>
          </label>
        </div>
      </fieldset>

      {/* ── SUBMIT ───────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition
                   hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
