// =============================================================================
// Admin Bank Accounts API - /api/admin/settings/bank-accounts
// =============================================================================

import { supabase } from './../../../_lib/supabase.js';
import { verifyAuth } from './../../../_lib/auth.js';

export default async function handler(req, res) {
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return getBankAccounts(req, res);
    case 'POST':
      return createBankAccount(req, res);
    case 'PUT':
      if (!id) return res.status(400).json({ error: 'ID required' });
      return updateBankAccount(req, res, id);
    case 'DELETE':
      if (!id) return res.status(400).json({ error: 'ID required' });
      return deleteBankAccount(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getBankAccounts(req, res) {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .order('currency');

    if (error) throw error;

    const accounts = (data || []).map(a => ({
      id: a.id,
      currency: a.currency,
      bankName: a.bank_name,
      accountName: a.account_name,
      accountNumber: a.account_number,
      sortCode: a.sort_code,
      routingNumber: a.routing_number,
      iban: a.iban,
      swiftCode: a.swift_code,
      branchName: a.branch_name,
      additionalInfo: a.additional_info,
      isActive: a.is_active,
    }));

    return res.status(200).json({ success: true, accounts });
  } catch (err) {
    console.error('Get bank accounts error:', err);
    return res.status(500).json({ error: 'Failed to fetch bank accounts' });
  }
}

async function createBankAccount(req, res) {
  try {
    const { currency, bankName, accountName, accountNumber, sortCode, routingNumber, iban, swiftCode, branchName, additionalInfo, isActive } = req.body;

    if (!currency || !bankName || !accountName || !accountNumber) {
      return res.status(400).json({ error: 'Currency, bank name, account name, and account number are required' });
    }

    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        currency: currency.toUpperCase(),
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
        sort_code: sortCode || null,
        routing_number: routingNumber || null,
        iban: iban || null,
        swift_code: swiftCode || null,
        branch_name: branchName || null,
        additional_info: additionalInfo || null,
        is_active: isActive !== false,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      account: {
        id: data.id,
        currency: data.currency,
        bankName: data.bank_name,
        accountName: data.account_name,
        accountNumber: data.account_number,
        sortCode: data.sort_code,
        routingNumber: data.routing_number,
        iban: data.iban,
        swiftCode: data.swift_code,
        branchName: data.branch_name,
        additionalInfo: data.additional_info,
        isActive: data.is_active,
      },
    });
  } catch (err) {
    console.error('Create bank account error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Bank account for this currency already exists' });
    }
    return res.status(500).json({ error: 'Failed to create bank account' });
  }
}

async function updateBankAccount(req, res, id) {
  try {
    const updates = {};
    const { currency, bankName, accountName, accountNumber, sortCode, routingNumber, iban, swiftCode, branchName, additionalInfo, isActive } = req.body;

    if (currency !== undefined) updates.currency = currency.toUpperCase();
    if (bankName !== undefined) updates.bank_name = bankName;
    if (accountName !== undefined) updates.account_name = accountName;
    if (accountNumber !== undefined) updates.account_number = accountNumber;
    if (sortCode !== undefined) updates.sort_code = sortCode || null;
    if (routingNumber !== undefined) updates.routing_number = routingNumber || null;
    if (iban !== undefined) updates.iban = iban || null;
    if (swiftCode !== undefined) updates.swift_code = swiftCode || null;
    if (branchName !== undefined) updates.branch_name = branchName || null;
    if (additionalInfo !== undefined) updates.additional_info = additionalInfo || null;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabase
      .from('bank_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, account: data });
  } catch (err) {
    console.error('Update bank account error:', err);
    return res.status(500).json({ error: 'Failed to update bank account' });
  }
}

async function deleteBankAccount(req, res, id) {
  try {
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Bank account deleted' });
  } catch (err) {
    console.error('Delete bank account error:', err);
    return res.status(500).json({ error: 'Failed to delete bank account' });
  }
}