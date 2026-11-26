export interface InvoicePaymentBreakdown {
  net: number;
  paid: number;
  pending: number;
  isCancelled: boolean;
  isPaymentCancelled: boolean;
}

export interface PendingInvoiceEntry {
  invoice: any;
  invoiceNo: string;
  net: number;
  paid: number;
  pending: number;
}

export const isTransferredInInvoice = (inv: any): boolean => {
  if (!inv) return false;
  if (inv.isTransferFee) return false;
  if (inv.transferredTo || inv.serviceTransferred) return false;
  if (inv.transferredFrom) return true;
  if (inv.isTransferred && !inv.transferredTo) return true;
  if (inv.paymentMode === 'Transferred') return true;
  return false;
};

export const getClientVisibleInvoices = (client: any): any[] => {
  if (!client) return [];

  const rawInvoicesList: any[] = [];
  if (client.invoices && Array.isArray(client.invoices) && client.invoices.length > 0) {
    rawInvoicesList.push(...client.invoices);
  }
  if (client.invoice) {
    const alreadyIncluded = rawInvoicesList.some(
      (inv) =>
        (inv.invoiceNo && inv.invoiceNo === client.invoice.invoiceNo) ||
        (inv._id && inv._id === client.invoice._id) ||
        (inv.id && inv.id === client.invoice.id)
    );
    if (!alreadyIncluded) {
      rawInvoicesList.unshift(client.invoice);
    }
  }

  return rawInvoicesList.filter((inv: any) => !isTransferredInInvoice(inv));
};

export const getInvoicePaymentBreakdown = (
  inv: any,
  fallbackAmount = 0
): InvoicePaymentBreakdown => {
  const isCancelled = Boolean(inv?.isCancelled || inv?.status === 'Cancelled' || inv?.serviceCancelled);
  const isPaymentCancelled = Boolean(inv?.paymentCancelled);

  const amount = Number(inv?.amount ?? inv?.totalDue ?? fallbackAmount) || 0;
  const net = Number(inv?.net ?? inv?.totalDue ?? amount) || 0;

  let paid = 0;
  if (isCancelled || isPaymentCancelled) {
    paid = 0;
  } else if (inv?.paid !== undefined && inv?.paid !== null && !isNaN(Number(inv.paid))) {
    paid = Number(inv.paid);
  } else if (inv?.totalPaid !== undefined && inv?.totalPaid !== null && !isNaN(Number(inv.totalPaid))) {
    paid = Number(inv.totalPaid);
  } else if (Array.isArray(inv?.paymentModes) && inv.paymentModes.length > 0) {
    paid = inv.paymentModes.reduce((acc: number, pm: any) => acc + (Number(pm.amount) || 0), 0);
  } else if (inv?.pendingAmount !== undefined && inv?.pendingAmount !== null && !isNaN(Number(inv.pendingAmount))) {
    paid = Math.max(0, net - Number(inv.pendingAmount));
  } else if (inv?.pending !== undefined && inv?.pending !== null && !isNaN(Number(inv.pending))) {
    paid = Math.max(0, net - Number(inv.pending));
  } else {
    paid = amount;
  }

  let pending = 0;
  if (isCancelled) {
    pending = 0;
  } else if (isPaymentCancelled) {
    pending = net;
  } else if (inv?.pending !== undefined && inv?.pending !== null && !isNaN(Number(inv.pending))) {
    pending = Math.max(0, Number(inv.pending));
  } else if (inv?.pendingAmount !== undefined && inv?.pendingAmount !== null && !isNaN(Number(inv.pendingAmount))) {
    pending = Math.max(0, Number(inv.pendingAmount));
  } else if (inv?.balanceAmount !== undefined && inv?.balanceAmount !== null && !isNaN(Number(inv.balanceAmount))) {
    pending = Math.max(0, Number(inv.balanceAmount));
  } else {
    pending = Math.max(0, net - paid);
  }

  return { net, paid, pending, isCancelled, isPaymentCancelled };
};

export const getDefaultInvoiceNo = (client: any): string => {
  if (client?.invoice?.invoiceNo) return client.invoice.invoiceNo;
  if (client?.invoiceNo) return client.invoiceNo;

  const dateObj = client?.startDate
    ? new Date(client.startDate)
    : client?.createdAt
    ? new Date(client.createdAt)
    : new Date();
  const monthStr = dateObj.toLocaleString('en-US', { month: 'short' });
  const yearStr = dateObj.getFullYear();

  if (client?._id) {
    const hex = String(client._id).replace(/[^0-9a-fA-F]/g, '').slice(-4) || '94';
    const num = (parseInt(hex, 16) % 90) + 10;
    return `${monthStr}${num}-${yearStr}`;
  }

  return `${monthStr}94-${yearStr}`;
};

export const getClientPendingSummary = (
  client: any
): { totalPending: number; pendingInvoices: PendingInvoiceEntry[] } => {
  if (!client) return { totalPending: 0, pendingInvoices: [] };

  const packagePrice = Number(client.packagePrice) || 0;
  const visibleInvoices = getClientVisibleInvoices(client);
  const fallbackInvNo = getDefaultInvoiceNo(client);

  if (visibleInvoices.length > 0) {
    const pendingInvoices: PendingInvoiceEntry[] = [];
    let totalPending = 0;

    visibleInvoices.forEach((inv: any, idx: number) => {
      const { net, paid, pending } = getInvoicePaymentBreakdown(inv, packagePrice);
      if (pending > 0) {
        totalPending += pending;
        pendingInvoices.push({
          invoice: inv,
          invoiceNo: inv.invoiceNo || (idx === 0 ? fallbackInvNo : `${fallbackInvNo}-${idx + 1}`),
          net,
          paid,
          pending,
        });
      }
    });

    return { totalPending, pendingInvoices };
  }

  const isInactiveOrTransfer =
    client.status === 'inactive' ||
    Boolean(client.isTransfer) ||
    (packagePrice === 0 && !client.invoice && (!client.invoices || client.invoices.length === 0));

  if (!isInactiveOrTransfer && packagePrice > 0) {
    const fbPaid =
      client.paid !== undefined
        ? Number(client.paid)
        : client.pendingAmount !== undefined
        ? Math.max(0, packagePrice - Number(client.pendingAmount))
        : client.pending !== undefined
        ? Math.max(0, packagePrice - Number(client.pending))
        : packagePrice;

    const fbPending =
      client.pending !== undefined
        ? Math.max(0, Number(client.pending))
        : client.pendingAmount !== undefined
        ? Math.max(0, Number(client.pendingAmount))
        : Math.max(0, packagePrice - fbPaid);

    if (fbPending > 0) {
      return {
        totalPending: fbPending,
        pendingInvoices: [
          {
            invoice: {
              invoiceNo: fallbackInvNo,
              amount: packagePrice,
              net: packagePrice,
              paid: fbPaid,
              pending: fbPending,
              date: client.startDate || client.createdAt || new Date().toISOString(),
            },
            invoiceNo: fallbackInvNo,
            net: packagePrice,
            paid: fbPaid,
            pending: fbPending,
          },
        ],
      };
    }
  }

  return { totalPending: 0, pendingInvoices: [] };
};

const matchesInvoice = (inv: any, target: any): boolean => {
  if (!inv || !target) return false;
  if (target.invoiceNo && inv.invoiceNo && inv.invoiceNo === target.invoiceNo) return true;
  if (target._id && inv._id && String(inv._id) === String(target._id)) return true;
  if (target.id && inv.id && String(inv.id) === String(target.id)) return true;
  return false;
};

export const buildCollectPaymentUpdate = (
  client: any,
  collectInvoice: any,
  collectAmount: number,
  collectMode: string,
  collectNotes: string
) => {
  const packagePrice = Number(client?.packagePrice) || 0;
  const { net, paid: prevPaid, pending: prevPending } = getInvoicePaymentBreakdown(
    collectInvoice,
    packagePrice
  );

  const totalDue = net || prevPaid + prevPending;
  const amount = Math.max(0, Number(collectAmount) || 0);
  const newPaid = prevPaid + amount;
  const newPending = Math.max(0, totalDue - newPaid);

  const baseInvoices =
    client?.invoices && Array.isArray(client.invoices) && client.invoices.length > 0
      ? [...client.invoices]
      : client?.invoice
      ? [client.invoice]
      : [];

  let invoiceFound = false;
  const updatedInvoices = baseInvoices.map((inv: any, idx: number) => {
    const isMatch =
      matchesInvoice(inv, collectInvoice) ||
      (baseInvoices.length === 1 && idx === 0 && !collectInvoice?.invoiceNo && !collectInvoice?._id && !collectInvoice?.id);

    if (isMatch) {
      invoiceFound = true;
      return {
        ...inv,
        invoiceNo: inv.invoiceNo || collectInvoice?.invoiceNo,
        amount: inv.amount ?? totalDue,
        net: inv.net ?? totalDue,
        paid: newPaid,
        totalPaid: newPaid,
        pending: newPending,
        pendingAmount: newPending,
        mode: collectMode,
        paymentModes: [
          ...(Array.isArray(inv.paymentModes) ? inv.paymentModes : []),
          { id: Date.now().toString(), mode: collectMode, amount },
        ],
        status: newPending === 0 ? 'Paid' : 'Partially Paid',
        paymentCancelled: false,
        date: inv.date || new Date().toISOString(),
        lastPaymentDate: new Date().toISOString(),
        collectPaymentNotes: collectNotes,
      };
    }
    return inv;
  });

  if (!invoiceFound) {
    updatedInvoices.push({
      ...(collectInvoice || {}),
      invoiceNo: collectInvoice?.invoiceNo || getDefaultInvoiceNo(client),
      amount: totalDue,
      net: totalDue,
      paid: newPaid,
      totalPaid: newPaid,
      pending: newPending,
      pendingAmount: newPending,
      mode: collectMode,
      status: newPending === 0 ? 'Paid' : 'Partially Paid',
      paymentCancelled: false,
      date: collectInvoice?.date || new Date().toISOString(),
      lastPaymentDate: new Date().toISOString(),
      collectPaymentNotes: collectNotes,
      paymentModes: [
        ...(Array.isArray(collectInvoice?.paymentModes) ? collectInvoice.paymentModes : []),
        { id: Date.now().toString(), mode: collectMode, amount },
      ],
    });
  }

  let updatedSingleInvoice = client?.invoice;
  if (
    client?.invoice &&
    (matchesInvoice(client.invoice, collectInvoice) || baseInvoices.length <= 1)
  ) {
    updatedSingleInvoice = {
      ...client.invoice,
      paid: newPaid,
      totalPaid: newPaid,
      pending: newPending,
      pendingAmount: newPending,
      mode: collectMode,
      paymentModes: [
        ...(Array.isArray(client.invoice?.paymentModes) ? client.invoice.paymentModes : []),
        { id: Date.now().toString(), mode: collectMode, amount },
      ],
      status: newPending === 0 ? 'Paid' : 'Partially Paid',
      paymentCancelled: false,
      date: client.invoice.date || new Date().toISOString(),
      lastPaymentDate: new Date().toISOString(),
      collectPaymentNotes: collectNotes,
    };
  } else if (!client?.invoice && updatedInvoices.length > 0) {
    updatedSingleInvoice = updatedInvoices[0];
  }

  return {
    amount,
    newPaid,
    newPending,
    updatePayload: {
      invoices: updatedInvoices,
      invoice: updatedSingleInvoice,
      paymentMode: collectMode,
    },
  };
};
