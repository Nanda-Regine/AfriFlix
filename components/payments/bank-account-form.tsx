'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

const SA_BANKS = [
  { name: 'ABSA Bank', code: '632005' },
  { name: 'African Bank', code: '430000' },
  { name: 'Capitec Bank', code: '470010' },
  { name: 'Discovery Bank', code: '679000' },
  { name: 'First National Bank (FNB)', code: '250655' },
  { name: 'Investec Bank', code: '580105' },
  { name: 'Nedbank', code: '198765' },
  { name: 'Old Mutual Bank', code: '462005' },
  { name: 'Standard Bank', code: '051001' },
  { name: 'TymeBank', code: '678910' },
]

const AFRICAN_COUNTRIES = [
  { code: 'ZA', name: 'South Africa', currency: 'ZAR' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN' },
  { code: 'KE', name: 'Kenya', currency: 'KES' },
  { code: 'GH', name: 'Ghana', currency: 'GHS' },
  { code: 'EG', name: 'Egypt', currency: 'EGP' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS' },
  { code: 'UG', name: 'Uganda', currency: 'UGX' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'ZWL' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW' },
  { code: 'SN', name: 'Senegal', currency: 'XOF' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF' },
  { code: 'CI', name: 'Côte d\'Ivoire', currency: 'XOF' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF' },
]

const MOBILE_PROVIDERS = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'mtn_momo', label: 'MTN MoMo' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'vodacom', label: 'Vodacom' },
  { value: 'orange', label: 'Orange Money' },
  { value: 'tigo', label: 'Tigo Cash' },
]

interface Props {
  existing?: {
    account_type: string
    bank_name?: string
    account_holder_name?: string
    bank_account_type?: string
    country: string
    currency: string
    mobile_provider?: string
    mobile_number?: string
  } | null
  onSaved?: () => void
}

export function BankAccountForm({ existing, onSaved }: Props) {
  const [accountType, setAccountType] = useState(existing?.account_type ?? 'bank')
  const [country, setCountry] = useState(existing?.country ?? 'ZA')
  const [bankName, setBankName] = useState(existing?.bank_name ?? '')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState(existing?.account_holder_name ?? '')
  const [bankAccountType, setBankAccountType] = useState(existing?.bank_account_type ?? 'cheque')
  const [mobileProvider, setMobileProvider] = useState(existing?.mobile_provider ?? '')
  const [mobileNumber, setMobileNumber] = useState(existing?.mobile_number ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const selectedCountry = AFRICAN_COUNTRIES.find(c => c.code === country)

  function handleBankSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const bank = SA_BANKS.find(b => b.code === e.target.value)
    if (bank) {
      setBankName(bank.name)
      setBankCode(bank.code)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body = {
      account_type: accountType,
      bank_name: bankName || undefined,
      bank_code: bankCode || undefined,
      account_number: accountNumber || undefined,
      account_holder_name: accountHolder || undefined,
      bank_account_type: bankAccountType || undefined,
      mobile_provider: mobileProvider || undefined,
      mobile_number: mobileNumber || undefined,
      country,
      currency: selectedCountry?.currency ?? 'ZAR',
    }

    try {
      const res = await fetch('/api/payouts/bank-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Save failed')
      }
      setSuccess(true)
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="bg-gold/10 border border-gold/20 rounded-xl p-6 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-syne font-semibold text-ivory mb-1">Payout details saved</p>
        <p className="text-ivory-dim text-sm">You'll receive your earnings automatically on the 1st of each month.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Account type toggle */}
      <div>
        <label className="text-xs font-mono text-ivory-dim uppercase tracking-wider block mb-2">Payout method</label>
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          {(['bank', 'mobile_money'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              className={`flex-1 py-2.5 text-sm font-syne transition-colors ${accountType === type ? 'bg-gold text-black font-semibold' : 'bg-black-card text-ivory-dim hover:text-ivory'}`}
            >
              {type === 'bank' ? 'Bank Account' : 'Mobile Money'}
            </button>
          ))}
        </div>
      </div>

      {/* Country */}
      <div>
        <label className="text-xs font-mono text-ivory-dim uppercase tracking-wider block mb-2">Country</label>
        <select
          value={country}
          onChange={e => setCountry(e.target.value)}
          className="w-full bg-black-card border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm focus:outline-none focus:border-gold/40"
        >
          {AFRICAN_COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>
          ))}
        </select>
      </div>

      {accountType === 'bank' ? (
        <>
          {country === 'ZA' ? (
            <div>
              <label className="text-xs font-mono text-ivory-dim uppercase tracking-wider block mb-2">Bank</label>
              <select
                onChange={handleBankSelect}
                defaultValue=""
                className="w-full bg-black-card border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm focus:outline-none focus:border-gold/40"
              >
                <option value="" disabled>Select your bank</option>
                {SA_BANKS.map(b => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs font-mono text-ivory-dim uppercase tracking-wider block mb-2">Bank name</label>
              <input
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="e.g. Zenith Bank"
                className="w-full bg-black-card border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm placeholder:text-ivory-dim/40 focus:outline-none focus:border-gold/40"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-mono text-ivory-dim uppercase tracking-wider block mb-2">Account number</label>
            <input
              required
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Your account number"
              className="w-full bg-black-card border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm placeholder:text-ivory-dim/40 focus:outline-none focus:border-gold/40 font-mono tracking-wider"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-ivory-dim uppercase tracking-wider block mb-2">Account holder name</label>
            <input
              required
              value={accountHolder}
              onChange={e => setAccountHolder(e.target.value)}
              placeholder="Full name as it appears on the account"
              className="w-full bg-black-card border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm placeholder:text-ivory-dim/40 focus:outline-none focus:border-gold/40"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-ivory-dim uppercase tracking-wider block mb-2">Account type</label>
            <div className="flex gap-3">
              {(['cheque', 'savings', 'current'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="bank_account_type"
                    value={t}
                    checked={bankAccountType === t}
                    onChange={() => setBankAccountType(t)}
                    className="accent-gold"
                  />
                  <span className="text-sm text-ivory-mid capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="text-xs font-mono text-ivory-dim uppercase tracking-wider block mb-2">Provider</label>
            <select
              required
              value={mobileProvider}
              onChange={e => setMobileProvider(e.target.value)}
              className="w-full bg-black-card border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm focus:outline-none focus:border-gold/40"
            >
              <option value="" disabled>Select provider</option>
              {MOBILE_PROVIDERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-ivory-dim uppercase tracking-wider block mb-2">Mobile number</label>
            <input
              required
              value={mobileNumber}
              onChange={e => setMobileNumber(e.target.value)}
              placeholder="+27 82 000 0000"
              className="w-full bg-black-card border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm placeholder:text-ivory-dim/40 focus:outline-none focus:border-gold/40 font-mono"
            />
          </div>
        </>
      )}

      {error && (
        <p className="text-terra-light text-sm bg-terra/10 border border-terra/20 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="bg-black-card border border-white/5 rounded-xl p-4">
        <p className="text-xs text-ivory-dim leading-relaxed">
          Your payout details are stored securely. Payouts are processed on the <strong className="text-ivory">1st of each month</strong> via Flutterwave for balances over R50 (or currency equivalent). AfriFlix retains 10% from tips — you receive the remaining 90%.
        </p>
      </div>

      <Button type="submit" variant="gold" className="w-full" disabled={saving}>
        {saving ? 'Saving...' : existing ? 'Update payout details' : 'Save payout details'}
      </Button>
    </form>
  )
}
