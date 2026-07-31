import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Trash2, Camera, Play } from 'lucide-react';

export default function ActionsPanel() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-5 shrink-0"
        >
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">Действия</h3>
            <div className="grid grid-cols-2 gap-3">
                <ActionButton icon={Terminal} label="Terminal" />
                <ActionButton icon={Camera} label="Скриншот" />
                <ActionButton icon={Trash2} label="Очистить" />
                <ActionButton icon={Play} label="Скрипт" />
            </div>
        </motion.div>
    );
}

function ActionButton({ icon: Icon, label }) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 bg-[var(--glass-glow)] hover:bg-[var(--bg-input)] border border-[var(--glass-border)] rounded-xl p-3 transition-colors text-sm text-main font-medium shadow-sm"
        >
            <Icon size={16} className="text-[var(--accent-primary)]" />
            {label}
        </motion.button>
    );
}