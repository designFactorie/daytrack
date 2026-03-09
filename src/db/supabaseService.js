import { supabase } from './supabaseClient';

export const supabaseService = {
    // Clients
    clients: {
        async getAll() {
            const { data, error } = await supabase.from('clients').select('*');
            if (error) throw error;
            return data;
        },
        async getById(id) {
            const { data, error } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
            if (error) throw error;
            return data;
        },
        async add(client) {
            const { data, error } = await supabase.from('clients').insert([client]).select();
            if (error) throw error;
            return data[0];
        },
        async update(id, updates) {
            const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select();
            if (error) throw error;
            return data[0];
        },
        async delete(id) {
            const { error } = await supabase.from('clients').delete().eq('id', id);
            if (error) throw error;
        }
    },

    // Employees
    employees: {
        async getAll() {
            const { data, error } = await supabase.from('employees').select('*');
            if (error) throw error;
            return data;
        },
        async add(employee) {
            const { data, error } = await supabase.from('employees').insert([employee]).select();
            if (error) throw error;
            return data[0];
        },
        async update(id, updates) {
            const { data, error } = await supabase.from('employees').update(updates).eq('id', id).select();
            if (error) throw error;
            return data[0];
        },
        async delete(id) {
            const { error } = await supabase.from('employees').delete().eq('id', id);
            if (error) throw error;
        }
    },

    // Tasks
    tasks: {
        async getAll() {
            const { data, error } = await supabase.from('tasks').select('*');
            if (error) throw error;
            return data;
        },
        async getByClient(clientId) {
            const { data, error } = await supabase.from('tasks').select('*').eq('clientId', clientId);
            if (error) throw error;
            return data;
        },
        async add(task) {
            const { data, error } = await supabase.from('tasks').insert([task]).select();
            if (error) throw error;
            return data[0];
        },
        async update(id, updates) {
            const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select();
            if (error) throw error;
            return data[0];
        },
        async delete(id) {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) throw error;
        }
    },

    // MOMs
    moms: {
        async getAll() {
            const { data, error } = await supabase.from('moms').select('*');
            if (error) throw error;
            return data;
        },
        async getByClient(clientId) {
            const { data, error } = await supabase.from('moms').select('*').eq('clientId', clientId).order('meetingDate', { ascending: false });
            if (error) throw error;
            return data;
        },
        async add(mom) {
            const { data, error } = await supabase.from('moms').insert([mom]).select();
            if (error) throw error;
            return data[0];
        },
        async update(id, updates) {
            const { data, error } = await supabase.from('moms').update(updates).eq('id', id).select();
            if (error) throw error;
            return data[0];
        },
        async delete(id) {
            const { error } = await supabase.from('moms').delete().eq('id', id);
            if (error) throw error;
        }
    },

    // Settings
    settings: {
        async getAll() {
            const { data, error } = await supabase.from('settings').select('*');
            if (error) throw error;
            return data;
        },
        async get(key) {
            const { data, error } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
            if (error) return null;
            return data?.value || null;
        },
        async set(key, value) {
            const { data, error } = await supabase.from('settings').upsert({ key, value }).select();
            if (error) throw error;
            return data[0];
        }
    }
};
