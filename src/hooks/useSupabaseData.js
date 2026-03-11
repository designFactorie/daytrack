import { useEffect, useState } from 'react';
import { supabase } from '../db/supabaseClient';

export function useSupabaseData(table, queryBuilder = (q) => q) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            let query = supabase.from(table).select('*');
            query = queryBuilder(query);
            const { data, error } = await query;
            if (error) throw error;
            setData(data || []);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Set up realtime subscription
        const channel = supabase
            .channel(`${table}_changes`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table]);

    return { data, loading, error, refresh: fetchData };
}
