const STORAGE_KEY = 'recipe-tracker:recipes';

let recipes = loadRecipes();
let editingId = null;
let viewingId = null;

const recipeGrid = document.getElementById('recipeGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');

const recipeDialog = document.getElementById('recipeDialog');
const recipeForm = document.getElementById('recipeForm');
const dialogTitle = document.getElementById('dialogTitle');
const nameInput = document.getElementById('recipeName');
const categoryInput = document.getElementById('recipeCategory');
const ingredientsInput = document.getElementById('recipeIngredients');
const stepsInput = document.getElementById('recipeSteps');

const viewDialog = document.getElementById('viewDialog');
const viewName = document.getElementById('viewName');
const viewCategory = document.getElementById('viewCategory');
const viewIngredients = document.getElementById('viewIngredients');
const viewSteps = document.getElementById('viewSteps');

function loadRecipes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Could not load recipes:', e);
    return [];
  }
}

function saveRecipes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const filtered = recipes.filter(r => {
    const matchesCategory = !category || r.category === category;
    const matchesQuery = !query ||
      r.name.toLowerCase().includes(query) ||
      r.ingredients.some(i => i.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  recipeGrid.innerHTML = '';
  emptyState.hidden = recipes.length > 0;
  emptyState.textContent = recipes.length === 0
    ? "No recipes yet. Add your first one above — it'll be saved right here in this browser."
    : "No recipes match your search.";
  emptyState.hidden = filtered.length > 0;

  filtered.forEach(recipe => {
    const card = document.createElement('button');
    card.className = 'recipe-card';
    card.type = 'button';
    card.innerHTML = `
      <span class="category-pill">${escapeHtml(recipe.category)}</span>
      <h3>${escapeHtml(recipe.name)}</h3>
      <span class="meta">${recipe.ingredients.length} ingredients · ${recipe.steps.length} steps</span>
    `;
    card.addEventListener('click', () => openView(recipe.id));
    recipeGrid.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function linesFromTextarea(value) {
  return value.split('\n').map(s => s.trim()).filter(Boolean);
}

function openAddDialog() {
  editingId = null;
  dialogTitle.textContent = 'Add a recipe';
  recipeForm.reset();
  recipeDialog.showModal();
}

function openEditDialog(id) {
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) return;
  editingId = id;
  dialogTitle.textContent = 'Edit recipe';
  nameInput.value = recipe.name;
  categoryInput.value = recipe.category;
  ingredientsInput.value = recipe.ingredients.join('\n');
  stepsInput.value = recipe.steps.join('\n');
  viewDialog.close();
  recipeDialog.showModal();
}

function openView(id) {
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) return;
  viewingId = id;
  viewName.textContent = recipe.name;
  viewCategory.textContent = recipe.category;
  viewIngredients.innerHTML = recipe.ingredients.map(i => `<li>${escapeHtml(i)}</li>`).join('');
  viewSteps.innerHTML = recipe.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('');
  viewDialog.showModal();
}

recipeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    name: nameInput.value.trim(),
    category: categoryInput.value,
    ingredients: linesFromTextarea(ingredientsInput.value),
    steps: linesFromTextarea(stepsInput.value),
  };

  if (editingId) {
    const idx = recipes.findIndex(r => r.id === editingId);
    if (idx !== -1) recipes[idx] = { ...recipes[idx], ...data };
  } else {
    recipes.unshift({ id: crypto.randomUUID(), ...data });
  }

  saveRecipes();
  recipeDialog.close();
  render();
});

document.getElementById('newRecipeBtn').addEventListener('click', openAddDialog);
document.getElementById('cancelBtn').addEventListener('click', () => recipeDialog.close());
document.getElementById('closeViewBtn').addEventListener('click', () => viewDialog.close());
document.getElementById('editBtn').addEventListener('click', () => openEditDialog(viewingId));
document.getElementById('deleteBtn').addEventListener('click', () => {
  recipes = recipes.filter(r => r.id !== viewingId);
  saveRecipes();
  viewDialog.close();
  render();
});

searchInput.addEventListener('input', render);
categoryFilter.addEventListener('change', render);

render();
