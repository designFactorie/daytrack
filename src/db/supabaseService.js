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

    // Payment Tranches
    tranches: {
        async getAll() {
            const { data, error } = await supabase.from('payment_tranches').select('*');
            if (error) throw error;
            return data;
        },
        async getByClient(clientId) {
            const { data, error } = await supabase.from('payment_tranches').select('*').eq('clientId', clientId).order('dueDate', { ascending: true });
            if (error) throw error;
            return data;
        },
        async add(tranche) {
            const { data, error } = await supabase.from('payment_tranches').insert([tranche]).select();
            if (error) throw error;
            return data[0];
        },
        async update(id, updates) {
            const { data, error } = await supabase.from('payment_tranches').update(updates).eq('id', id).select();
            if (error) throw error;
            return data[0];
        },
        async delete(id) {
            const { error } = await supabase.from('payment_tranches').delete().eq('id', id);
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
        async get(key, defaultValue = null) {
            const { data, error } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
            if (error) return defaultValue;
            return data?.value || defaultValue;
        },
        async set(key, value) {
            const { data, error } = await supabase.from('settings').upsert({ key, value }).select();
            if (error) throw error;
            return data[0];
        }
    },

    // Global Migration / Import
    async importDB(payload) {
        const { clients = [], employees = [], tasks = [], moms = [], payment_tranches = [] } = payload;

        // 1. Import Clients
        if (clients.length > 0) {
            const { error } = await supabase.from('clients').insert(clients);
            if (error) throw error;
        }

        // 2. Import Employees
        if (employees.length > 0) {
            const { error } = await supabase.from('employees').insert(employees);
            if (error) throw error;
        }

        // 3. Import Tasks
        if (tasks.length > 0) {
            const { error } = await supabase.from('tasks').insert(tasks);
            if (error) throw error;
        }

        // 4. Import MOMs
        if (moms.length > 0) {
            const { error } = await supabase.from('moms').insert(moms);
            if (error) throw error;
        }

        // 5. Import Payment Tranches
        if (payment_tranches.length > 0) {
            const { error } = await supabase.from('payment_tranches').insert(payment_tranches);
            if (error) throw error;
        }

        return { success: true };
    }
};
