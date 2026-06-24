# Advisor — Bounded Context (IA conversacional sobre el préstamo)

Nuevo bounded context que agrega un **asesor conversacional** a SmartDrive:
el usuario pregunta en lenguaje natural sobre un préstamo y la IA responde
usando las cifras reales de ese préstamo (TCEA, cuota, seguros, etc.).

Sigue las mismas convenciones DDD del proyecto: capas
`domain / application / infrastructure / presentation`, patrón
`Api → Endpoint → Assembler`, store con signals, componentes standalone,
e i18n con ngx-translate.

## Estructura

```
advisor/
├── domain/model/
│   ├── chat-message.ts          # ChatMessage (implements BaseEntity)
│   └── advisor-answer.ts        # AdvisorAnswer
├── application/
│   └── advisor.store.ts         # store con signals (messages, busy, error)
├── infrastructure/
│   ├── advisor-response.ts      # resources (contrato wire, snake_case)
│   ├── advisor-assembler.ts     # resource -> entity
│   ├── advisor-api-endpoint.ts  # cliente HTTP del endpoint
│   └── advisor-api.ts           # facade (extends BaseApi)
└── presentation/components/advisor-chat/
    ├── advisor-chat.component.ts/.html/.css
```

## Cómo usar el chat en una vista

En cualquier vista donde tengas un `loanId` (ej. simulation-page), importá el
componente y pasale el id del préstamo:

```typescript
import { AdvisorChatComponent } from '../../../advisor/presentation/components/advisor-chat/advisor-chat.component';

@Component({
  // ...
  imports: [/* ... */, AdvisorChatComponent],
})
export class SimulationPageComponent {
  protected loanId = '...'; // el id del préstamo actual
}
```

```html
<app-advisor-chat [loanId]="loanId" />
```

## Contrato con el backend (a implementar)

El frontend espera este endpoint en el backend Spring Boot:

```
POST {apiBaseUrl}/advisor/ask
Body:
{
  "loan_id": "string",
  "question": "string",
  "history": [{ "role": "user|assistant", "content": "string" }]
}
Response:
{
  "id": "string",
  "answer": "string",
  "used_figures": ["TCEA: 18.2%", "Cuota: S/ 850", ...]
}
```

El backend debe: cargar el préstamo por `loan_id`, armar el contexto con sus
cifras reales, y llamar a Gemini con un prompt que responda SOLO desde esos
datos (anti-alucinación). Eso lo construimos en el siguiente paso.

## Endpoint añadido al environment

Se agregó `platformProviderAdvisorAskEndpointPath: '/advisor/ask'` a
`environment.ts` y `environment.development.ts`.
