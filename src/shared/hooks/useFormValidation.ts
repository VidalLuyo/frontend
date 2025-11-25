import { useState, useCallback } from 'react'

export interface ValidationErrors {
     firstName?: string
     lastName?: string
     documentNumber?: string
     phone?: string
     email?: string
     userName?: string
}

export interface FormData {
     firstName: string
     lastName: string
     documentNumber: string
     phone: string
     email: string
     userName: string
     [key: string]: unknown
}

export function useFormValidation() {
     const [errors, setErrors] = useState<ValidationErrors>({})
     const [touched, setTouched] = useState<Record<string, boolean>>({})

     const validateName = useCallback((name: string): string | undefined => {
          if (!name) return 'Este campo es requerido'
          if (name.length < 2) return 'Debe tener al menos 2 caracteres'
          if (name.length > 50) return 'Debe tener máximo 50 caracteres'
          if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/.test(name)) {
               return 'Solo se permiten letras y espacios'
          }
          return undefined
     }, [])

     const validateDocumentNumber = useCallback((doc: string): string | undefined => {
          if (!doc) return 'Este campo es requerido'
          if (!/^\d{8}$/.test(doc)) {
               return 'Debe tener exactamente 8 dígitos numéricos'
          }
          return undefined
     }, [])

     const validatePhone = useCallback((phone: string): string | undefined => {
          if (!phone) return 'Este campo es requerido'
          if (!/^9\d{8}$/.test(phone)) {
               return 'Debe comenzar con 9 y tener 9 dígitos'
          }
          return undefined
     }, [])

     const validateEmail = useCallback((email: string): string | undefined => {
          if (!email) return 'Este campo es requerido'
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(email)) {
               return 'Ingrese un email válido'
          }
          return undefined
     }, [])

     const validateUserName = useCallback((userName: string): string | undefined => {
          if (!userName) return 'Este campo es requerido'
          if (userName.length < 3) return 'Debe tener al menos 3 caracteres'
          if (userName.length > 20) return 'Debe tener máximo 20 caracteres'
          if (!/^[a-zA-Z0-9._-]+$/.test(userName)) {
               return 'Solo letras, números, puntos, guiones y guiones bajos'
          }
          return undefined
     }, [])

     const validateField = useCallback((field: string, value: string): string | undefined => {
          switch (field) {
               case 'firstName':
               case 'lastName':
                    return validateName(value)
               case 'documentNumber':
                    return validateDocumentNumber(value)
               case 'phone':
                    return validatePhone(value)
               case 'email':
                    return validateEmail(value)
               case 'userName':
                    return validateUserName(value)
               default:
                    return undefined
          }
     }, [validateName, validateDocumentNumber, validatePhone, validateEmail, validateUserName])

     const validateForm = useCallback((formData: FormData): ValidationErrors => {
          const newErrors: ValidationErrors = {}

          for (const field of Object.keys(formData)) {
               if (['firstName', 'lastName', 'documentNumber', 'phone', 'email', 'userName'].includes(field)) {
                    const error = validateField(field, formData[field] as string)
                    if (error) {
                         newErrors[field as keyof ValidationErrors] = error
                    }
               }
          }

          return newErrors
     }, [validateField])

     const handleFieldChange = useCallback((field: string, value: string) => {
          setTouched(prev => ({ ...prev, [field]: true }))

          const error = validateField(field, value)
          setErrors(prev => ({
               ...prev,
               [field]: error
          }))
     }, [validateField])

     const handleFieldBlur = useCallback((field: string) => {
          setTouched(prev => ({ ...prev, [field]: true }))
     }, [])

     const isFormValid = useCallback((formData: FormData): boolean => {
          const formErrors = validateForm(formData)
          return Object.keys(formErrors).length === 0
     }, [validateForm])

     return {
          errors,
          touched,
          validateField,
          validateForm,
          handleFieldChange,
          handleFieldBlur,
          isFormValid,
          setErrors,
          setTouched
     }
}
