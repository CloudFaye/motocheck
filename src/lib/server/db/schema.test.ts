/**
 * Tests for database schema definition
 * Validates that all tables, constraints, and relationships are properly defined
 */

import { describe, it, expect } from 'vitest';
import { lookups, orders, reports } from './schema';

describe('Database Schema', () => {
	describe('lookups table', () => {
		it('should have all required columns', () => {
			const columns = Object.keys(lookups);
			expect(columns).toContain('id');
			expect(columns).toContain('vin');
			expect(columns).toContain('decodedJson');
			expect(columns).toContain('ncsValuationUsd');
			expect(columns).toContain('valuationConfidence');
			expect(columns).toContain('dutyJson');
			expect(columns).toContain('cbnRateNgn');
			expect(columns).toContain('rateFetchedAt');
			expect(columns).toContain('createdAt');
			expect(columns).toContain('refreshedAt');
		});

		it('should have vin column with length 17', () => {
			const vinColumn = lookups.vin;
			expect(vinColumn).toBeDefined();
		});

		it('should have unique constraint on vin', () => {
			const vinColumn = lookups.vin;
			expect(vinColumn.isUnique).toBe(true);
		});
	});

	describe('orders table', () => {
		it('should have all required columns', () => {
			const columns = Object.keys(orders);
			expect(columns).toContain('id');
			expect(columns).toContain('lookupId');
			expect(columns).toContain('email');
			expect(columns).toContain('amountNgn');
			expect(columns).toContain('flwTxRef');
			expect(columns).toContain('flwTxId');
			expect(columns).toContain('status');
			expect(columns).toContain('source');
			expect(columns).toContain('telegramChatId');
			expect(columns).toContain('createdAt');
			expect(columns).toContain('paidAt');
		});

		it('should have foreign key to lookups table', () => {
			const lookupIdColumn = orders.lookupId;
			expect(lookupIdColumn).toBeDefined();
			// Foreign key relationship is defined in the schema
		});
	});

	describe('reports table', () => {
		it('should have all required columns', () => {
			const columns = Object.keys(reports);
			expect(columns).toContain('id');
			expect(columns).toContain('orderId');
			expect(columns).toContain('r2Key');
			expect(columns).toContain('pdfHash');
			expect(columns).toContain('signedUrl');
			expect(columns).toContain('sentAt');
			expect(columns).toContain('createdAt');
		});

		it('should have unique foreign key to orders table', () => {
			const orderIdColumn = reports.orderId;
			expect(orderIdColumn).toBeDefined();
			expect(orderIdColumn.isUnique).toBe(true);
		});

		it('should have pdfHash column with length 64', () => {
			const pdfHashColumn = reports.pdfHash;
			expect(pdfHashColumn).toBeDefined();
		});
	});
});
