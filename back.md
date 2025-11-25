# 📋 Análisis Backend - CRUD de Matrículas
## Problema: Progreso de Documentos no Persistente

---

## 🚨 **PROBLEMA IDENTIFICADO**

**Síntoma:** El progreso de documentos se resetea a 0/11 (0%) al refrescar la página del frontend, a pesar de que los documentos se marcan correctamente al crear/editar la matrícula.

**Impacto:** Los usuarios pierden el seguimiento del progreso de documentos, afectando la experiencia y la gestión administrativa.

---

## 🗄️ **ESTRUCTURA DE TABLA ACTUAL**

### Tabla: `enrollments`

**Campos de Documentos (Columnas 5-15):**
```sql
birth_certificate        boolean  YES  false
student_dni              boolean  YES  false  
guardian_dni             boolean  YES  false
vaccination_card         boolean  YES  false
disability_certificate  boolean  YES  false
utility_bill             boolean  YES  false
psychological_report     boolean  YES  false
student_photo            boolean  YES  false
health_record            boolean  YES  false
signed_enrollment_form   boolean  YES  false
dni_verification         boolean  YES  false
```

**Observaciones de la Estructura:**
- ✅ **Campos correctos:** Todos los campos de documentos están definidos como `boolean`
- ✅ **Valores por defecto:** Configurados como `false`
- ✅ **Nullable:** Permitido (`YES`), lo que puede causar problemas

---

## 🔍 **ANÁLISIS TÉCNICO**

### 1. **Posibles Causas del Problema**

#### A. **Valores NULL vs FALSE**
```sql
-- ❌ PROBLEMA POTENCIAL
INSERT INTO enrollments (student_id, birth_certificate) 
VALUES ('student123', NULL);  -- Se inserta NULL en lugar de FALSE

-- ✅ COMPORTAMIENTO ESPERADO  
INSERT INTO enrollments (student_id, birth_certificate) 
VALUES ('student123', FALSE); -- Se inserta FALSE explícitamente
```

#### B. **Serialización JSON Inconsistente**
```json
// ❌ PROBLEMA: Backend devuelve
{
  "birth_certificate": null,
  "student_dni": null,
  "guardian_dni": true
}

// ✅ ESPERADO: Backend debería devolver
{
  "birth_certificate": false,
  "student_dni": false, 
  "guardian_dni": true
}
```

#### C. **Mapeo ORM Incorrecto**
```java
// ❌ PROBLEMA POTENCIAL en Entity
@Column(name = "birth_certificate")
private Boolean birthCertificate; // Boolean permite null

// ✅ SOLUCIÓN RECOMENDADA
@Column(name = "birth_certificate", nullable = false, columnDefinition = "boolean default false")
private boolean birthCertificate; // boolean primitivo no permite null
```

---

## 🛠️ **ENDPOINTS A REVISAR**

### 1. **GET /api/v1/enrollments/active**
```http
GET /api/v1/enrollments/active
```

**Verificar:**
- ¿Los campos de documentos se devuelven como `boolean` o `null`?
- ¿Se aplica alguna transformación en el serializer?

### 2. **GET /api/v1/enrollments/pending**
```http
GET /api/v1/enrollments/pending
```

### 3. **GET /api/v1/enrollments/cancelled**
```http
GET /api/v1/enrollments/cancelled
```

### 4. **POST /api/v1/enrollments**
```http
POST /api/v1/enrollments
Content-Type: application/json

{
  "studentId": "student123",
  "institutionId": "inst123", 
  "classroomId": "room123",
  "academicYear": "2025",
  "academicPeriodId": "period123",
  "ageGroup": "3_AÑOS",
  "shift": "MAÑANA",
  "section": "UNICA",
  "modality": "PRESENCIAL",
  "educationalLevel": "INITIAL",
  "enrollmentStatus": "PENDING",
  "enrollmentType": "NUEVA",
  
  // 🔍 DOCUMENTOS - VERIFICAR ESTOS CAMPOS
  "birthCertificate": true,
  "studentDni": false,
  "guardianDni": true,
  "vaccinationCard": false,
  "disabilityCertificate": false,
  "utilityBill": true,
  "psychologicalReport": false,
  "studentPhoto": true,
  "healthRecord": false,
  "signedEnrollmentForm": true,
  "dniVerification": false
}
```

**Verificar en POST:**
- ¿Se guardan correctamente los valores `true`/`false`?
- ¿Se convierten a `null` en algún punto del proceso?

---

## 🧪 **PRUEBAS RECOMENDADAS**

### 1. **Verificación Directa en Base de Datos**
```sql
-- Crear matrícula de prueba
INSERT INTO enrollments (
  id, student_id, institution_id, classroom_id, 
  academic_year, academic_period_id, enrollment_status,
  enrollment_type, age_group, shift, section, modality,
  birth_certificate, student_dni, guardian_dni,
  vaccination_card, utility_bill, student_photo,
  signed_enrollment_form
) VALUES (
  'test_enrollment_001',
  'test_student_001', 
  'test_institution_001',
  'test_classroom_001',
  '2025',
  'test_period_001',
  'PENDING',
  'NUEVA',
  '3_AÑOS',
  'MAÑANA', 
  'UNICA',
  'PRESENCIAL',
  true,    -- birth_certificate
  false,   -- student_dni  
  true,    -- guardian_dni
  false,   -- vaccination_card
  true,    -- utility_bill
  true,    -- student_photo
  true     -- signed_enrollment_form
);

-- Verificar valores guardados
SELECT 
  id,
  birth_certificate,
  student_dni,
  guardian_dni, 
  vaccination_card,
  disability_certificate,
  utility_bill,
  psychological_report,
  student_photo,
  health_record,
  signed_enrollment_form,
  dni_verification
FROM enrollments 
WHERE id = 'test_enrollment_001';
```

### 2. **Verificación de Respuesta API**
```bash
# Probar endpoint GET
curl -X GET "http://localhost:9082/api/v1/enrollments/active" \
  -H "Content-Type: application/json" | jq '.[] | {
    id: .id,
    documents: {
      birth_certificate: .birth_certificate,
      student_dni: .student_dni,
      guardian_dni: .guardian_dni,
      vaccination_card: .vaccination_card,
      disability_certificate: .disability_certificate,
      utility_bill: .utility_bill,
      psychological_report: .psychological_report,
      student_photo: .student_photo,
      health_record: .health_record,
      signed_enrollment_form: .signed_enrollment_form,
      dni_verification: .dni_verification
    }
  }'
```

---

## 🔧 **SOLUCIONES RECOMENDADAS**

### 1. **Solución en Entity/Model (Java/Spring Boot)**
```java
@Entity
@Table(name = "enrollments")
public class Enrollment {
    
    // Otros campos...
    
    @Column(name = "birth_certificate", nullable = false, columnDefinition = "boolean default false")
    private boolean birthCertificate = false;
    
    @Column(name = "student_dni", nullable = false, columnDefinition = "boolean default false") 
    private boolean studentDni = false;
    
    @Column(name = "guardian_dni", nullable = false, columnDefinition = "boolean default false")
    private boolean guardianDni = false;
    
    @Column(name = "vaccination_card", nullable = false, columnDefinition = "boolean default false")
    private boolean vaccinationCard = false;
    
    @Column(name = "disability_certificate", nullable = false, columnDefinition = "boolean default false")
    private boolean disabilityCertificate = false;
    
    @Column(name = "utility_bill", nullable = false, columnDefinition = "boolean default false")
    private boolean utilityBill = false;
    
    @Column(name = "psychological_report", nullable = false, columnDefinition = "boolean default false")
    private boolean psychologicalReport = false;
    
    @Column(name = "student_photo", nullable = false, columnDefinition = "boolean default false")
    private boolean studentPhoto = false;
    
    @Column(name = "health_record", nullable = false, columnDefinition = "boolean default false")
    private boolean healthRecord = false;
    
    @Column(name = "signed_enrollment_form", nullable = false, columnDefinition = "boolean default false")
    private boolean signedEnrollmentForm = false;
    
    @Column(name = "dni_verification", nullable = false, columnDefinition = "boolean default false")
    private boolean dniVerification = false;
    
    // Getters y Setters...
}
```

### 2. **Solución en DTO/Response**
```java
public class EnrollmentResponseDto {
    
    // Otros campos...
    
    // Asegurar que siempre devuelva boolean, nunca null
    public boolean isBirthCertificate() {
        return birthCertificate != null ? birthCertificate : false;
    }
    
    public boolean isStudentDni() {
        return studentDni != null ? studentDni : false;
    }
    
    // Repetir para todos los campos de documentos...
}
```

### 3. **Solución en Service/Repository**
```java
@Service
public class EnrollmentService {
    
    public Enrollment createEnrollment(CreateEnrollmentDto dto) {
        Enrollment enrollment = new Enrollment();
        
        // Mapear campos básicos...
        
        // Asegurar valores boolean explícitos para documentos
        enrollment.setBirthCertificate(dto.getBirthCertificate() != null ? dto.getBirthCertificate() : false);
        enrollment.setStudentDni(dto.getStudentDni() != null ? dto.getStudentDni() : false);
        enrollment.setGuardianDni(dto.getGuardianDni() != null ? dto.getGuardianDni() : false);
        enrollment.setVaccinationCard(dto.getVaccinationCard() != null ? dto.getVaccinationCard() : false);
        enrollment.setDisabilityCertificate(dto.getDisabilityCertificate() != null ? dto.getDisabilityCertificate() : false);
        enrollment.setUtilityBill(dto.getUtilityBill() != null ? dto.getUtilityBill() : false);
        enrollment.setPsychologicalReport(dto.getPsychologicalReport() != null ? dto.getPsychologicalReport() : false);
        enrollment.setStudentPhoto(dto.getStudentPhoto() != null ? dto.getStudentPhoto() : false);
        enrollment.setHealthRecord(dto.getHealthRecord() != null ? dto.getHealthRecord() : false);
        enrollment.setSignedEnrollmentForm(dto.getSignedEnrollmentForm() != null ? dto.getSignedEnrollmentForm() : false);
        enrollment.setDniVerification(dto.getDniVerification() != null ? dto.getDniVerification() : false);
        
        return enrollmentRepository.save(enrollment);
    }
}
```

### 4. **Solución en Base de Datos (Migración)**
```sql
-- Actualizar valores NULL existentes a FALSE
UPDATE enrollments SET 
  birth_certificate = COALESCE(birth_certificate, false),
  student_dni = COALESCE(student_dni, false),
  guardian_dni = COALESCE(guardian_dni, false),
  vaccination_card = COALESCE(vaccination_card, false),
  disability_certificate = COALESCE(disability_certificate, false),
  utility_bill = COALESCE(utility_bill, false),
  psychological_report = COALESCE(psychological_report, false),
  student_photo = COALESCE(student_photo, false),
  health_record = COALESCE(health_record, false),
  signed_enrollment_form = COALESCE(signed_enrollment_form, false),
  dni_verification = COALESCE(dni_verification, false);

-- Cambiar columnas a NOT NULL con default FALSE
ALTER TABLE enrollments 
  ALTER COLUMN birth_certificate SET NOT NULL,
  ALTER COLUMN birth_certificate SET DEFAULT false,
  ALTER COLUMN student_dni SET NOT NULL,
  ALTER COLUMN student_dni SET DEFAULT false,
  ALTER COLUMN guardian_dni SET NOT NULL,
  ALTER COLUMN guardian_dni SET DEFAULT false,
  ALTER COLUMN vaccination_card SET NOT NULL,
  ALTER COLUMN vaccination_card SET DEFAULT false,
  ALTER COLUMN disability_certificate SET NOT NULL,
  ALTER COLUMN disability_certificate SET DEFAULT false,
  ALTER COLUMN utility_bill SET NOT NULL,
  ALTER COLUMN utility_bill SET DEFAULT false,
  ALTER COLUMN psychological_report SET NOT NULL,
  ALTER COLUMN psychological_report SET DEFAULT false,
  ALTER COLUMN student_photo SET NOT NULL,
  ALTER COLUMN student_photo SET DEFAULT false,
  ALTER COLUMN health_record SET NOT NULL,
  ALTER COLUMN health_record SET DEFAULT false,
  ALTER COLUMN signed_enrollment_form SET NOT NULL,
  ALTER COLUMN signed_enrollment_form SET DEFAULT false,
  ALTER COLUMN dni_verification SET NOT NULL,
  ALTER COLUMN dni_verification SET DEFAULT false;
```

---

## 📊 **DATOS DE PRUEBA FRONTEND**

### Payload que envía el Frontend:
```json
{
  "studentId": "68fdd785d99218068ee7d6e7",
  "institutionId": "68ffad5cb0f5ad304fa65110", 
  "classroomId": "68ffad5db0f5ad304fa65111",
  "academicYear": "2025",
  "academicPeriodId": "period123",
  "ageGroup": "3_AÑOS",
  "shift": "MAÑANA",
  "section": "UNICA",
  "modality": "PRESENCIAL",
  "educationalLevel": "INITIAL",
  "enrollmentStatus": "PENDING",
  "enrollmentType": "NUEVA",
  "birthCertificate": true,
  "studentDni": true,
  "guardianDni": false,
  "vaccinationCard": true,
  "disabilityCertificate": false,
  "utilityBill": false,
  "psychologicalReport": false,
  "studentPhoto": true,
  "healthRecord": false,
  "signedEnrollmentForm": true,
  "dniVerification": true
}
```

### Respuesta esperada del Backend:
```json
{
  "id": "enr_12345",
  "studentId": "68fdd785d99218068ee7d6e7",
  "institutionId": "68ffad5cb0f5ad304fa65110",
  "classroomId": "68ffad5db0f5ad304fa65111",
  "academicYear": "2025",
  "enrollmentStatus": "PENDING",
  "birthCertificate": true,
  "studentDni": true,
  "guardianDni": false,
  "vaccinationCard": true,
  "disabilityCertificate": false,
  "utilityBill": false,
  "psychologicalReport": false,
  "studentPhoto": true,
  "healthRecord": false,
  "signedEnrollmentForm": true,
  "dniVerification": true,
  "createdAt": "2025-10-31T08:24:09.498812700"
}
```

---

## 🎯 **CHECKLIST DE VERIFICACIÓN**

### Backend Developer - Verificar:

- [ ] **1. Logs de Creación**
  - ¿Se están recibiendo correctamente los valores boolean en el POST?
  - ¿Se están guardando en la base de datos como `true`/`false` o como `null`?

- [ ] **2. Logs de Consulta**  
  - ¿Los SELECT devuelven `true`/`false` o `null` para los campos de documentos?
  - ¿Hay alguna transformación en el mapper/serializer?

- [ ] **3. Configuración ORM**
  - ¿Los campos están definidos como `Boolean` (nullable) o `boolean` (primitivo)?
  - ¿Hay valores por defecto configurados correctamente?

- [ ] **4. Validación de Endpoints**
  - Probar POST con documentos marcados como `true`
  - Verificar GET inmediatamente después del POST
  - Confirmar que los valores persisten correctamente

- [ ] **5. Serialización JSON**
  - ¿Se está usando algún custom serializer para boolean?
  - ¿Hay configuración de Jackson que pueda estar afectando?

---

## 🚀 **PRÓXIMOS PASOS**

1. **Verificar logs del backend** durante creación y consulta de matrículas
2. **Ejecutar queries directas** en la base de datos para verificar valores guardados  
3. **Probar endpoints** con herramientas como Postman/curl
4. **Implementar soluciones** según los hallazgos
5. **Validar fix** con el frontend

---

## 📞 **CONTACTO**

Si necesitas más información o tienes dudas sobre la implementación, contacta al equipo de frontend para coordinar pruebas conjuntas.

**Prioridad:** 🔴 **ALTA** - Afecta funcionalidad crítica del sistema de matrículas.