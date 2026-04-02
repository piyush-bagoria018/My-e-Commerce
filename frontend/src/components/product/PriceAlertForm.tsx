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
		<div className="mt-4 rounded-lg border border-border bg-background p-4">
			<p className="text-sm font-semibold">Set Price Alert</p>
			<p className="mt-1 text-xs text-muted">Get notified when the price drops to your target</p>

			<form onSubmit={handleSubmit} className="mt-3 space-y-3">
				{/* Email Input */}
				<div>
					<label htmlFor="alert-email" className="block text-xs font-medium text-foreground">
						Email
					</label>
					<input
						id="alert-email"
						type="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={state === 'loading' || state === 'success'}
						className="mt-1.5 w-full rounded border border-input bg-surface px-3 py-2 text-sm placeholder-muted transition disabled:opacity-50"
					/>
				</div>

				{/* Target Price Input */}
				<div>
					<label htmlFor="alert-price" className="block text-xs font-medium text-foreground">
						Target Price (Rs)
						<span className="float-right text-muted">Current: Rs {currentPrice}</span>
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
						className="mt-1.5 w-full rounded border border-input bg-surface px-3 py-2 text-sm placeholder-muted transition disabled:opacity-50"
					/>
					<p className="mt-1 text-xs text-muted">
						You'll save: <span className="font-semibold text-accent">Rs {currentPrice - targetPrice}</span>
					</p>
				</div>

				{/* Submit Button */}
				<button
					type="submit"
					disabled={state === 'loading' || state === 'success'}
					className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${
						state === 'success'
							? 'bg-accent/20 text-accent'
							: state === 'loading'
								? 'bg-primary/50 text-white'
								: 'bg-primary text-white hover:bg-primary/90'
					} disabled:cursor-not-allowed`}
				>
					{state === 'loading' ? 'Setting Alert...' : state === 'success' ? '✓ Alert Set!' : 'Set Alert'}
				</button>

				{/* Feedback Message */}
				{message && (
					<div
						className={`rounded-md px-3 py-2 text-xs font-medium ${
							state === 'success'
								? 'bg-accent/15 text-accent'
								: 'bg-red-50 text-red-700'
						}`}
					>
						{message}
					</div>
				)}
			</form>
		</div>
	);
}
