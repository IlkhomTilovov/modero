import { useState, useEffect } from 'react';
import { apiGet } from '@/integrations/api/client';

export interface CheckoutFieldOption {
  id: string;
  field_id: string;
  label_uz: string;
  label_ru: string;
  value: string;
  is_active: boolean;
  sort_order: number;
}

export interface CheckoutField {
  id: string;
  label_uz: string;
  label_ru: string;
  field_type: string;
  icon: string | null;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  options: CheckoutFieldOption[];
}

function mapOption(o: any): CheckoutFieldOption {
  return {
    id: o.id,
    field_id: o.fieldId,
    label_uz: o.labelUz,
    label_ru: o.labelRu,
    value: o.value,
    is_active: o.isActive,
    sort_order: o.sortOrder,
  };
}

export function useCheckoutFields() {
  const [fields, setFields] = useState<CheckoutField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      setError(null);

      const [{ items: fieldsData }, { items: optionsData }] = await Promise.all([
        apiGet<{ items: any[] }>('/api/checkout-fields'),
        apiGet<{ items: any[] }>('/api/checkout-field-options'),
      ]);

      const options = optionsData.map(mapOption);
      const fieldsWithOptions: CheckoutField[] = fieldsData.map((field) => ({
        id: field.id,
        label_uz: field.labelUz,
        label_ru: field.labelRu,
        field_type: field.fieldType,
        icon: field.icon,
        is_required: field.isRequired,
        is_active: field.isActive,
        sort_order: field.sortOrder,
        options: options.filter((opt) => opt.field_id === field.id),
      }));

      setFields(fieldsWithOptions);
    } catch (err: any) {
      console.error('Error fetching checkout fields:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { fields, loading, error, refetch: fetchFields };
}
