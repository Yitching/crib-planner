import { money } from './format';
import type { Inputs, PayStopId, Stop } from './types';

export interface CheckItem {
  id: string;
  text: string;
}

/**
 * What to sort out before each HDB appointment. Based on HDB's general process;
 * the appointment letter from HDB has the final list.
 */
export function checklist(id: PayStopId, stop: Stop, i: Inputs, cashLeft: number): CheckItem[] {
  const pay = `${money(stop.amount)} ready: ${money(stop.cpfPart)} from CPF and ${money(stop.cashPart)} in cash`;
  const list: (CheckItem | false)[] = [];

  if (id === 'book') {
    list.push(
      { id: 'hfe', text: 'A valid HDB Flat Eligibility (HFE) letter' },
      { id: 'nric', text: 'NRIC of everyone in the application' },
      { id: 'fee', text: `Option fee of ${money(stop.amount)}, paid in cash or by card/NETS` },
      { id: 'marriage', text: 'Marriage certificate, or proof you are applying under the Fiancé/Fiancée Scheme' },
      { id: 'shortlist', text: 'A shortlist of units, in case your first choice is taken' },
      { id: 'loan', text: 'Decide: HDB loan or bank loan' },
    );
  }

  if (id === 'sign') {
    list.push(
      { id: 'nric', text: 'NRIC of all buyers' },
      { id: 'pay', text: `Downpayment, stamp duty and fees: ${pay}` },
      i.loanType === 'hdb'
        ? { id: 'hfe', text: 'HFE letter still valid on the day' }
        : { id: 'lo', text: "The bank's Letter of Offer for your loan" },
      { id: 'cpf', text: 'Check your CPF OA balances can cover the CPF part' },
      { id: 'lawyer', text: 'Decide who handles the legal work: HDB or your own lawyer' },
      i.scheme === 'dia' && { id: 'dia', text: 'Keep payslips handy: HDB will assess your income before key collection' },
    );
  }

  if (id === 'keys') {
    list.push(
      { id: 'nric', text: 'NRIC of all buyers' },
      { id: 'pay', text: `Rest of the downpayment and fees: ${pay}` },
      { id: 'marriage', text: 'Marriage certificate, if you booked under the Fiancé/Fiancée Scheme' },
      i.scheme === 'dia' && { id: 'income', text: 'Latest payslips or CPF contribution history for your income assessment' },
      i.loanType === 'hdb'
        ? { id: 'fire', text: 'HDB fire insurance (needed with an HDB loan)' }
        : { id: 'mortgage', text: 'Mortgage papers signed with your bank' },
      { id: 'hps', text: 'Home Protection Scheme cover, if you will pay the loan with CPF' },
      { id: 'inspect', text: 'Inspect the flat and note any defects to report' },
      { id: 'reno', text: `Line up your renovation: you'll have about ${money(cashLeft)} for it` },
    );
  }

  return list.filter((x): x is CheckItem => Boolean(x));
}
