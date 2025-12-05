// CalendarFormModal.tsx
import { useState, useEffect } from "react";
import type { Calendar } from "../models/Calendar";
import type { InstitutionMinimal } from "../models/InstitutionMinimal";
import { calendarService } from "../service/CalendarService";
import { X } from 'lucide-react';

interface CalendarFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (calendar: Calendar) => void;
    initialData?: Calendar;
    institutions: InstitutionMinimal[];
}

export const CalendarFormModal = ({
    isOpen,
    onClose,
    onSaved,
    initialData,
    institutions,
}: CalendarFormModalProps) => {
    const [institutionId, setInstitutionId] = useState("");
    const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear());
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (initialData) {
            setInstitutionId(initialData.institutionId);
            setAcademicYear(initialData.academicYear);
            setStartDate(initialData.startDate);
            setEndDate(initialData.endDate);
        } else {
            setInstitutionId("");
            setAcademicYear(new Date().getFullYear());
            setStartDate("");
            setEndDate("");
        }
        setError("");
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!institutionId) {
            setError("El campo institución es obligatorio");
            setLoading(false);
            return;
        }
        if (academicYear < 2000 || academicYear > 2100) {
            setError("El año académico debe estar entre 2000 y 2100");
            setLoading(false);
            return;
        }
        if (!startDate || !endDate || new Date(endDate) <= new Date(startDate)) {
            setError("Las fechas son inválidas: endDate debe ser posterior a startDate");
            setLoading(false);
            return;
        }

        try {
            const existingCalendars = await calendarService.getAll();
            const exists = existingCalendars.some(
                (c) =>
                    c.institutionId === institutionId &&
                    c.academicYear === academicYear &&
                    (!initialData || c.calendarId !== initialData.calendarId)
            );

            if (exists) {
                setError(`Ya existe un calendario para esta institución y año académico.`);
                setLoading(false);
                return;
            }

            const payload = {
                institutionId,
                academicYear,
                startDate,
                endDate,
            };

            const saved = await calendarService.create(payload);
            onSaved(saved);
            onClose();
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Error al guardar calendario");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/40">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto animate-[fadeInScale_.25s_ease-out]">
                <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">
                            {initialData ? "Editar Calendario" : "Nuevo Calendario"}
                        </h2>
                        <p className="text-teal-100 text-sm mt-1">Gestiona el calendario académico</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white hover:bg-white/20 transition-all p-2 rounded-lg"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-3 block uppercase tracking-wide">
                            Institución
                        </label>
                        <select
                            className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                            value={institutionId}
                            onChange={(e) => setInstitutionId(e.target.value)}
                        >
                            <option value="">Selecciona una institución</option>
                            {institutions.map(inst => (
                                <option key={inst.institutionId} value={inst.institutionId}>
                                    {inst.institutionInformation?.institutionName || inst.institutionName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-3 block uppercase tracking-wide">
                            Año Académico
                        </label>
                        <input
                            type="number"
                            className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                            value={academicYear}
                            onChange={(e) => setAcademicYear(Number(e.target.value))}
                            placeholder="Ej: 2024"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-3 block uppercase tracking-wide">
                                Fecha Inicio
                            </label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-3 block uppercase tracking-wide">
                                Fecha Fin
                            </label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            className="px-6 py-3 rounded-2xl bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all font-semibold"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-700 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg"
                            disabled={loading}
                        >
                            {loading ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>

            <style>
                {`
                  @keyframes fadeInScale {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                  }
                `}
            </style>
        </div>
    );
};
