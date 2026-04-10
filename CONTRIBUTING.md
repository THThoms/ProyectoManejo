# 🤝 Guía de Contribución — Nova Codice / Proyecto Manejo

¡Gracias por querer contribuir al proyecto! Por favor, lee atentamente estas reglas antes de realizar cualquier cambio.

---

## 📋 Tabla de Contenidos

1. [Código de Conducta](#-código-de-conducta)
2. [Flujo de trabajo GitFlow](#-flujo-de-trabajo-gitflow)
3. [Cómo contribuir](#-cómo-contribuir)
4. [Convenciones de commits](#-convenciones-de-commits)
5. [Revisión de código (Pull Requests)](#-revisión-de-código-pull-requests)
6. [Estándares de código](#-estándares-de-código)

---

## 🧭 Código de Conducta

- Tratar a todos los integrantes con respeto y profesionalismo.
- Comunicar los problemas con claridad y sin ataques personales.
- Cualquier decisión importante debe consultarse con el líder del grupo antes de implementarse.
- Está prohibido hacer `push` directo a `main` o `develop` sin revisión previa.

---

## 🌿 Flujo de Trabajo GitFlow

Este proyecto usa el modelo **GitFlow**. Las ramas son:

| Rama | Propósito |
|---|---|
| `main` | Código en producción (estable, solo merge desde `release` o `hotfix`) |
| `develop` | Integración continua de nuevas funcionalidades |
| `feature/nombre` | Desarrollo de una característica nueva |
| `release/vX.X` | Preparación para lanzar una versión |
| `hotfix/nombre` | Corrección urgente de un bug en producción |

### Crear una rama feature:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/nombre-de-la-funcionalidad
```

### Crear una rama hotfix:
```bash
git checkout main
git pull origin main
git checkout -b hotfix/descripcion-del-bug
```

---

## 🛠️ Cómo contribuir

1. **Haz un fork** del repositorio (si eres externo al equipo).
2. **Clona** el repositorio en tu máquina local.
3. **Crea una rama** siguiendo el modelo GitFlow (ver arriba).
4. Realiza tus cambios y **haz commits** siguiendo las convenciones.
5. **Sube tu rama** al repositorio remoto:
   ```bash
   git push origin feature/nombre-de-la-funcionalidad
   ```
6. Abre un **Pull Request** hacia `develop` con una descripción clara de lo que hiciste.
7. Espera la **revisión** de al menos un compañero antes de hacer merge.

---

## 💬 Convenciones de Commits

Usa el formato: `tipo(alcance): descripción breve`

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `style` | Cambios de estilos CSS / formato |
| `docs` | Cambios en documentación |
| `refactor` | Refactorización de código |
| `chore` | Tareas de mantenimiento (gitignore, configs) |

### Ejemplos:
```
feat(carousel): agregar botones de navegación táctil
fix(script): corregir error en loop de partículas
docs(readme): actualizar sección de instalación
style(css): ajustar colores del header
```

---

## 🔍 Revisión de Código (Pull Requests)

- Todo PR debe tener un **título claro** y una **descripción** del cambio.
- Se requiere al menos **1 aprobación** de otro integrante antes del merge.
- El autor del PR **no puede aprobar su propio PR**.
- Los PR hacia `main` solo pueden venir desde `release/*` o `hotfix/*`.
- Resolver todos los comentarios antes de hacer el merge.

### Plantilla de PR:
```
## ¿Qué cambia este PR?
(Descripción breve)

## ¿Por qué se hace este cambio?
(Motivación o issue relacionado)

## ¿Cómo probarlo?
(Pasos para verificar el cambio)
```

---

## 📐 Estándares de Código

- **HTML**: Usar etiquetas semánticas, indentación de 2 o 4 espacios.
- **CSS**: Usar nombres de clases en inglés o español consistente, sin estilos en línea.
- **JavaScript**: Usar `const`/`let`, evitar `var`, comentar funciones complejas.
- No dejar código comentado innecesario en los commits finales.
- No subir imágenes de más de **1 MB** sin optimizarlas.

---

## 📞 Contacto

¿Dudas? Contacta al líder del grupo: **Alen** o abre un *Issue* en el repositorio.
