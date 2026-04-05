'use client';

import { useState } from 'react';
import { createPriceAlert } from '@/services/price-tracking.service';

type PriceAlertFormProps = {
	productId: string;
	currentPrice: number;
	onAlertCreated?: () => void;
};

type AlertState = 'idle' | 'loading' | 'success' | 'error';

export function PriceAlertForm({ productId, currentPrice, onAlertCreated }: PriceAlertFormProps) {
	const [state, setState] = useState<AlertState>('idle');
	const [email, setEmail] = useState('');
	const [targetPrice, setTargetPrice] = useState(Math.round(currentPrice * 0.9)); // Default 10% discount
	const [message, setMessage] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		if (!email.trim()) {
			setMessage('Please enter your email');
			setState('error');
			return;
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setMessage('Please enter a valid email');
			setState('error');
			return;
		}

		if (!targetPrice || targetPrice <= 0) {
			setMessage('Target price must be greater than 0');
			setState('error');
			return;
		}

		if (targetPrice >= currentPrice) {
			setMessage('Target price must be lower than current price');
			setState('error');
			return;
		}

		try {
			setState('loading');
			setMessage('');

			const response = await createPriceAlert({
				productId,
				userEmail: email.toLowerCase().trim(),
				targetPrice,
			});

			if (response) {
				setState('success');
				setMessage('Alert created! You\'ll be notified when the price reaches your target.');
				setEmail('');
				setTargetPrice(Math.round(currentPrice * 0.9));

				// Reset to idle after 3 seconds
				setTimeout(() => {
					setState('idle');
					setMessage('');
					onAlertCreated?.();
				}, 3000);
			}
		} catch (err) {
			setState('error');
			const errorMsg = err instanceof Error ? err.message : 'Failed to create alert';
			setMessage(errorMsg);
		}
	};

	return (
		<div className="rounded-[22px] border border-white/10 bg-[#2b2b2b] p-4 text-[#f6f3ec] shadow-[0_12px_32px_-24px_rgba(0,0,0,0.65)]">
			<p className="text-xs uppercase tracking-[0.22em] text-[#d8d4cb]/75">Price Alert</p>
			<p className="mt-2 text-sm text-[#efece4]">Set your target and we’ll notify you the moment the price drops below it.</p>

			<form onSubmit={handleSubmit} className="mt-3 space-y-3">
				{/* Email Input */}
				<div>
					<label htmlFor="alert-email" className="block text-xs font-medium text-[#f6f3ec]">
						Email
					</label>
					<input
						id="alert-email"
						type="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={state === 'loading' || state === 'success'}
						className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#1f1f1f] px-3 py-2.5 text-sm text-[#f6f3ec] placeholder:text-[#9c9587] transition focus:border-[#78cbb6] focus:outline-none disabled:opacity-50"
					/>
				</div>

				{/* Target Price Input */}
				<div>
					<label htmlFor="alert-price" className="block text-xs font-medium text-[#f6f3ec]">
						Target Price (Rs)
						<span className="float-right text-[#d8d4cb]/70">Current: Rs {currentPrice.toLocaleString('en-IN')}</span>
					</label>
					<input
						id="alert-price"
						type="number"
						placeholder="Enter target price"
						value={targetPrice}
						onChange={(e) => setTargetPrice(parseInt(e.target.value) || 0)}
						disabled={state === 'loading' || state === 'success'}
						min="1"
						max={currentPrice - 1}
						className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#1f1f1f] px-3 py-2.5 text-sm text-[#f6f3ec] placeholder:text-[#9c9587] transition focus:border-[#78cbb6] focus:outline-none disabled:opacity-50"
					/>
					<p className="mt-1 text-xs text-[#d8d4cb]/70">
						You’ll save: <span className="font-semibold text-[#86e3c8]">Rs {(currentPrice - targetPrice).toLocaleString('en-IN')}</span>
					</p>
				</div>

				{/* Submit Button */}
				<button
					type="submit"
					disabled={state === 'loading' || state === 'success'}
					className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${
						state === 'success'
							? 'bg-[#dff5ee] text-[#1f5449]'
							: state === 'loading'
								? 'bg-[#c65b39] text-white'
								: 'bg-[#e4572e] text-white hover:bg-[#c94a23]'
					} disabled:cursor-not-allowed`}
				>
					{state === 'loading' ? 'Setting Alert...' : state === 'success' ? '✓ Alert Set!' : 'Set Alert'}
				</button>

				{/* Feedback Message */}
				{message && (
					<div
						className={`rounded-md px-3 py-2 text-xs font-medium ${
							state === 'success'
								? 'bg-[#dff5ee] text-[#1f5449]'
								: 'bg-[#4a2520] text-[#ffd1c6]'
						}`}
					>
						{message}
					</div>
				)}
			</form>
		</div>
	);
}
