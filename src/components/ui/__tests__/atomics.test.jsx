import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Save, Trash2, CheckCircle2 } from 'lucide-react';
import Button from '../Button';
import Card from '../Card';
import Modal, { ConfirmModal } from '../Modal';
import Pill, { Badge } from '../Pill';

describe('<Button />', () => {
  it('rend les 5 variantes', () => {
    ['primary', 'secondary', 'ghost', 'tertiary', 'destructive'].forEach(v => {
      const { container } = render(<Button variant={v}>Test</Button>);
      expect(container.querySelector('button')).toBeInTheDocument();
    });
  });

  it('passe en état loading et désactive', () => {
    render(<Button loading>Sauvegarder</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('appelle onClick quand cliqué', () => {
    let called = 0;
    render(<Button onClick={() => { called += 1; }}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(called).toBe(1);
  });

  it('rend leftIcon et rightIcon', () => {
    const { container } = render(<Button leftIcon={Save} rightIcon={Trash2}>Test</Button>);
    expect(container.querySelectorAll('svg').length).toBe(2);
  });

  it('mode iconOnly ne rend pas children', () => {
    render(<Button iconOnly leftIcon={Save}>HiddenLabel</Button>);
    expect(screen.queryByText('HiddenLabel')).toBeNull();
  });

  it('fullWidth ajoute w-full', () => {
    const { container } = render(<Button fullWidth>Plein</Button>);
    expect(container.querySelector('button').className).toContain('w-full');
  });
});

describe('<Card />', () => {
  it('rend les 3 variantes (default, elevated, muted)', () => {
    ['default', 'elevated', 'muted'].forEach(v => {
      const { container } = render(<Card variant={v}>Hi</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('Card.Header rend title + subtitle', () => {
    render(
      <Card>
        <Card.Header title="Titre" subtitle="Sous-titre" />
      </Card>
    );
    expect(screen.getByText('Titre')).toBeInTheDocument();
    expect(screen.getByText('Sous-titre')).toBeInTheDocument();
  });

  it('Card.Footer rend actions à droite', () => {
    render(
      <Card>
        <Card.Footer>
          <button>OK</button>
        </Card.Footer>
      </Card>
    );
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('hover prop ajoute classes hover', () => {
    const { container } = render(<Card hover>Hover</Card>);
    expect(container.firstChild.className).toContain('hover:-translate-y-0.5');
  });
});

describe('<Modal />', () => {
  it('ne rend rien si open=false', () => {
    const { container } = render(<Modal open={false}>Hidden</Modal>);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('rend le contenu quand open=true', () => {
    render(<Modal open onClose={() => {}}>VisibleContent</Modal>);
    expect(screen.getByText('VisibleContent')).toBeInTheDocument();
  });

  it('appelle onClose au clic sur le bouton X', () => {
    let closed = false;
    render(<Modal open onClose={() => { closed = true; }}>Body</Modal>);
    fireEvent.click(screen.getByLabelText('Fermer'));
    expect(closed).toBe(true);
  });

  it('appelle onClose à la touche Escape', () => {
    let closed = false;
    render(<Modal open onClose={() => { closed = true; }}>Body</Modal>);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(closed).toBe(true);
  });

  it('ne ferme pas avec Escape si dismissOnEsc=false', () => {
    let closed = false;
    render(<Modal open onClose={() => { closed = true; }} dismissOnEsc={false}>Body</Modal>);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(closed).toBe(false);
  });

  it('Modal.Header / Body / Footer composables', () => {
    render(
      <Modal open onClose={() => {}}>
        <Modal.Header title="Titre modal" subtitle="Sous-titre" />
        <Modal.Body>Contenu</Modal.Body>
        <Modal.Footer>
          <button>Action</button>
        </Modal.Footer>
      </Modal>
    );
    expect(screen.getByText('Titre modal')).toBeInTheDocument();
    expect(screen.getByText('Contenu')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('verrouille le scroll body quand ouvert', () => {
    const { unmount } = render(<Modal open onClose={() => {}}>Body</Modal>);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});

describe('<ConfirmModal />', () => {
  it('rend titre, description, et 2 boutons', () => {
    render(
      <ConfirmModal
        open
        title="Confirmer ?"
        description="Action irréversible"
        confirmLabel="Oui"
        cancelLabel="Non"
      />
    );
    expect(screen.getByText('Confirmer ?')).toBeInTheDocument();
    expect(screen.getByText('Action irréversible')).toBeInTheDocument();
    expect(screen.getByText('Oui')).toBeInTheDocument();
    expect(screen.getByText('Non')).toBeInTheDocument();
  });

  it('appelle onConfirm/onCancel', () => {
    let confirmed = 0, cancelled = 0;
    render(
      <ConfirmModal
        open
        title="Action ?"
        onConfirm={() => { confirmed += 1; }}
        onCancel={() => { cancelled += 1; }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(confirmed).toBe(1);
    expect(cancelled).toBe(1);
  });
});

describe('<Pill /> et <Badge />', () => {
  it('Pill rend children avec variant success', () => {
    render(<Pill variant="success">OK</Pill>);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('Pill avec icône Lucide', () => {
    const { container } = render(<Pill variant="success" icon={CheckCircle2}>Validé</Pill>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('Badge rend numéro avec variant danger', () => {
    render(<Badge variant="danger">12</Badge>);
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});
