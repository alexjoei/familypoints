import { applyCommand, Group, Language, Template } from './model';
export function starterTemplates(language: Language): Template[] {
  const es = language === 'es';
  return [
    [es ? 'Preparar una cena' : 'Make dinner', es ? 'Cocinar' : 'Cooking', 15],
    [es ? 'Fregar los platos' : 'Wash the dishes', es ? 'Limpieza' : 'Cleaning', 10],
    [es ? 'Hacer la compra' : 'Get the groceries', es ? 'Compra' : 'Shopping', 20],
    [es ? 'Resolver una gestión' : 'Handle an errand', es ? 'Gestiones' : 'Errands', 15],
    [es ? 'Encargarse de un cuidado' : 'Take care of someone', es ? 'Cuidado' : 'Care', 20],
    [es ? 'Organizar un plan' : 'Organize a plan', es ? 'Organización' : 'Organizing', 15],
    [es ? 'Echar una mano' : 'Lend a hand', es ? 'Favores' : 'Favors', 10],
  ].map(([title, category, points], i) => ({
    id: `template-${i}`,
    title: String(title),
    category: String(category),
    points: Number(points),
  }));
}
export function createDemo(language: Language, variant: 'couple' | 'group' = 'couple'): Group {
  const templates = starterTemplates(language),
    es = language === 'es',
    couple = variant === 'couple';
  let g: Group = {
    id: 'demo',
    name: couple ? (es ? 'Alex y Sam' : 'Alex & Sam') : es ? 'La buena compañía' : 'Good company',
    owner: 'alex',
    members: [
      { id: 'alex', name: 'Alex' },
      { id: 'sam', name: 'Sam' },
      ...(couple ? [] : [{ id: 'dani', name: 'Dani' }]),
    ],
    categories: templates.map((t) => t.category),
    templates,
    proposals: [],
    activity: [],
  };
  const date = new Date().toISOString().slice(0, 10);
  const submit = (
    author: string,
    id: string,
    kind: 'contribution' | 'reward',
    title: string,
    points: number,
    templateId?: string,
  ) => {
    g = applyCommand(g, author, {
      type: 'submit',
      id,
      kind,
      title,
      points,
      category: templates[0].category,
      date,
      note: '',
      templateId,
    });
  };
  const approve = (id: string, actors: string[]) =>
    actors
      .filter((actor) => g.members.some((m) => m.id === actor))
      .forEach((actor) => {
        g = applyCommand(g, actor, { type: 'vote', id, revision: 1, choice: 'approve' });
      });
  submit(
    'alex',
    'demo-c1',
    'contribution',
    couple
      ? es
        ? 'Cena para dos'
        : 'Dinner for two'
      : es
        ? 'Cena para todo el grupo'
        : 'Dinner for everyone',
    40,
    templates[0].id,
  );
  approve('demo-c1', ['sam', 'dani']);
  submit(
    'sam',
    'demo-c2',
    'contribution',
    es ? 'La compra de la semana' : 'The weekly groceries',
    20,
  );
  approve('demo-c2', ['alex', 'dani']);
  submit('sam', 'demo-r1', 'reward', es ? 'Yo elijo la película' : 'I pick the movie', 30);
  approve('demo-r1', ['alex', 'dani']);
  submit(
    couple ? 'alex' : 'dani',
    'demo-r2',
    'reward',
    es ? 'Una noche sin cocinar' : 'A night off cooking',
    50,
  );
  approve('demo-r2', couple ? ['sam'] : ['alex', 'sam']);
  submit('alex', 'demo-r3', 'reward', es ? 'Noche libre' : 'A free evening', 100);
  approve('demo-r3', ['sam', 'dani']);
  submit('sam', 'demo-c3', 'contribution', es ? 'He salvado las plantas' : 'Saved the plants', 15);
  return g;
}
