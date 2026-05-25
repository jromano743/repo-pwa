const preview = document.getElementById('preview');

function createInput(label, placeholder, cls = '') {
  return `
    <div class="field ${cls}">
      <label>${label}</label>
      <input type="text" placeholder="${placeholder}">
    </div>
  `;
}

function addExperience(data = {}) {
  const container = document.getElementById('experienceContainer');

  const div = document.createElement('div');
  div.className = 'dynamic-item experience-item';

  div.innerHTML = `
    ${createInput('Puesto', 'Frontend Developer')}
    ${createInput('Empresa', 'Empresa S.A.')}
    ${createInput('Periodo', '2022 - Actualidad')}

    <div class="field">
      <label>Descripción</label>
      <textarea placeholder="Describe responsabilidades y logros..."></textarea>
    </div>

    <button class="btn-danger" onclick="this.parentElement.remove(); updatePreview();">
      Eliminar
    </button>
  `;

  container.appendChild(div);

  if(data.position) {
    const inputs = div.querySelectorAll('input');
    const textarea = div.querySelector('textarea');

    inputs[0].value = data.position;
    inputs[1].value = data.company;
    inputs[2].value = data.period;
    textarea.value = data.description;
  }

  bindUpdates();
  updatePreview();
}

function addEducation(data = {}) {
  const container = document.getElementById('educationContainer');

  const div = document.createElement('div');
  div.className = 'dynamic-item education-item';

  div.innerHTML = `
    ${createInput('Institución', 'Universidad XYZ')}
    ${createInput('Título', 'Ingeniería en Sistemas')}
    ${createInput('Periodo', '2018 - 2023')}

    <button class="btn-danger" onclick="this.parentElement.remove(); updatePreview();">
      Eliminar
    </button>
  `;

  container.appendChild(div);

  if(data.school) {
    const inputs = div.querySelectorAll('input');

    inputs[0].value = data.school;
    inputs[1].value = data.degree;
    inputs[2].value = data.period;
  }

  bindUpdates();
  updatePreview();
}

function addSkill(data = '') {
  const container = document.getElementById('skillsContainer');

  const div = document.createElement('div');
  div.className = 'dynamic-item skill-item';

  div.innerHTML = `
    ${createInput('Habilidad', 'JavaScript / SQL / Liderazgo')}

    <button class="btn-danger" onclick="this.parentElement.remove(); updatePreview();">
      Eliminar
    </button>
  `;

  container.appendChild(div);

  if(data) {
    div.querySelector('input').value = data;
  }

  bindUpdates();
  updatePreview();
}

function getFormData() {
  const experiences = [];
  const education = [];
  const skills = [];

  document.querySelectorAll('.experience-item').forEach(item => {
    const inputs = item.querySelectorAll('input');
    const textarea = item.querySelector('textarea');

    experiences.push({
      position: inputs[0].value,
      company: inputs[1].value,
      period: inputs[2].value,
      description: textarea.value
    });
  });

  document.querySelectorAll('.education-item').forEach(item => {
    const inputs = item.querySelectorAll('input');

    education.push({
      school: inputs[0].value,
      degree: inputs[1].value,
      period: inputs[2].value
    });
  });

  document.querySelectorAll('.skill-item').forEach(item => {
    skills.push(item.querySelector('input').value);
  });

  return {
    fullName: document.getElementById('fullName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    portfolio: document.getElementById('portfolio').value,
    summary: document.getElementById('summary').value,
    experiences,
    education,
    skills
  };
}

function updatePreview() {
  const data = getFormData();

  preview.innerHTML = `
    <h1>${data.fullName || 'Tu Nombre'}</h1>

    <p>
      ${data.email || ''} |
      ${data.phone || ''}
    </p>

    <p>${data.portfolio || ''}</p>

    <h3>Perfil Profesional</h3>
    <p>${data.summary || 'Tu descripción profesional aparecerá aquí.'}</p>

    <h3>Experiencia</h3>
    ${data.experiences.map(exp => `
      <div class="item">
        <strong>${exp.position}</strong>
        <p>${exp.company} | ${exp.period}</p>
        <p>${exp.description}</p>
      </div>
    `).join('')}

    <h3>Educación</h3>
    ${data.education.map(edu => `
      <div class="item">
        <strong>${edu.degree}</strong>
        <p>${edu.school} | ${edu.period}</p>
      </div>
    `).join('')}

    <h3>Habilidades</h3>
    <p>${data.skills.join(' • ')}</p>
  `;
}

function bindUpdates() {
  document.querySelectorAll('input, textarea').forEach(el => {
    el.removeEventListener('input', updatePreview);
    el.addEventListener('input', updatePreview);
  });
}

async function generatePDF() {
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4'
  });

  const data = getFormData();

  const pageWidth = 595;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);

  let y = 60;

  function checkPageBreak(extra = 20) {
    if (y + extra > 780) {
      doc.addPage();
      y = 60;
    }
  }

  function drawSectionTitle(title) {
    checkPageBreak(40);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(title, margin, y);

    y += 10;

    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);

    y += 18;
  }

  function drawParagraph(text = '', fontSize = 11) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);

    const lines = doc.splitTextToSize(text, contentWidth);

    lines.forEach(line => {
      checkPageBreak(20);
      doc.text(line, margin, y);
      y += 16;
    });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(data.fullName || 'Tu Nombre', margin, y);

  y += 24;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const contactLine = [data.email, data.phone]
    .filter(Boolean)
    .join(' | ');

  if (contactLine) {
    doc.text(contactLine, margin, y);
    y += 18;
  }

  if (data.portfolio) {
    doc.text(data.portfolio, margin, y);
    y += 24;
  }

  drawSectionTitle('Perfil Profesional');
  drawParagraph(data.summary || '');

  y += 10;

  drawSectionTitle('Experiencia Laboral');

  data.experiences.forEach(exp => {
    checkPageBreak(60);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(exp.position || '', margin, y);

    y += 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const subtitle = [exp.company, exp.period]
      .filter(Boolean)
      .join(' | ');

    if (subtitle) {
      doc.text(subtitle, margin, y);
      y += 16;
    }

    drawParagraph(exp.description || '');

    y += 10;
  });

  drawSectionTitle('Educación');

  data.education.forEach(edu => {
    checkPageBreak(50);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(edu.degree || '', margin, y);

    y += 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const eduLine = [edu.school, edu.period]
      .filter(Boolean)
      .join(' | ');

    if (eduLine) {
      doc.text(eduLine, margin, y);
      y += 26;
    }
  });

  drawSectionTitle('Habilidades');
  drawParagraph(data.skills.join(' • '));

  const safeName = (data.fullName || 'cv').replace(/\s+/g, '_');
  doc.save(safeName + '_ATS.pdf');
}

function saveData() {
  localStorage.setItem('ats_cv_data', JSON.stringify(getFormData()));
  alert('Datos guardados localmente.');
}

function loadData() {
  const raw = localStorage.getItem('ats_cv_data');

  if(!raw) {
    alert('No hay datos guardados.');
    return;
  }

  const data = JSON.parse(raw);

  document.getElementById('fullName').value = data.fullName || '';
  document.getElementById('email').value = data.email || '';
  document.getElementById('phone').value = data.phone || '';
  document.getElementById('portfolio').value = data.portfolio || '';
  document.getElementById('summary').value = data.summary || '';

  document.getElementById('experienceContainer').innerHTML = '';
  document.getElementById('educationContainer').innerHTML = '';
  document.getElementById('skillsContainer').innerHTML = '';

  (data.experiences || []).forEach(addExperience);
  (data.education || []).forEach(addEducation);
  (data.skills || []).forEach(addSkill);

  bindUpdates();
  updatePreview();
}

bindUpdates();
updatePreview();

addExperience();
addEducation();
addSkill();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Service Worker registrado'))
    .catch(err => console.error('Error SW', err));
}
