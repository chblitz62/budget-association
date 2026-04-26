import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Inbox } from 'lucide-react';
import DataTable, { Table, THead, TBody, TR, TH, TD, EmptyTable, SortIndicator } from '../DataTable';

describe('<Table /> structure de base', () => {
  it('rend un wrapper avec table HTML interne', () => {
    const { container } = render(<Table><tbody><tr><td>X</td></tr></tbody></Table>);
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('variant=borderless n\'applique pas le card glass', () => {
    const { container } = render(<Table variant="borderless"><tbody></tbody></Table>);
    // Pas de classes rounded-2xl du glass card
    expect(container.firstChild.className).not.toContain('rounded-2xl');
  });

  it('darkMode applique les classes appropriées', () => {
    const { container } = render(<Table darkMode><tbody></tbody></Table>);
    expect(container.firstChild.getAttribute('data-darkmode')).toBe('true');
  });
});

describe('<TH /> et <TD />', () => {
  it('TH rend en uppercase via text.label', () => {
    const { container } = render(
      <table><thead><tr><TH>Libellé</TH></tr></thead></table>
    );
    const th = container.querySelector('th');
    expect(th.className).toContain('uppercase');
  });

  it('TD avec align=right ajoute text-right', () => {
    const { container } = render(
      <table><tbody><tr><TD align="right">X</TD></tr></tbody></table>
    );
    expect(container.querySelector('td').className).toContain('text-right');
  });

  it('TD avec mono ajoute tabular-nums', () => {
    const { container } = render(
      <table><tbody><tr><TD mono>123</TD></tr></tbody></table>
    );
    expect(container.querySelector('td').className).toContain('tabular-nums');
  });

  it('TD padding 12px (px-4 py-3)', () => {
    const { container } = render(
      <table><tbody><tr><TD>X</TD></tr></tbody></table>
    );
    const td = container.querySelector('td');
    expect(td.className).toContain('px-4');
    expect(td.className).toContain('py-3');
  });
});

describe('<TH sortable />', () => {
  it('avec sortable, déclenche onSort au clic', () => {
    const onSort = vi.fn();
    const { container } = render(
      <table><thead><tr>
        <TH sortable onSort={onSort}>Col</TH>
      </tr></thead></table>
    );
    fireEvent.click(container.querySelector('th'));
    expect(onSort).toHaveBeenCalledTimes(1);
  });

  it('aria-sort reflète sortDir', () => {
    const { container, rerender } = render(
      <table><thead><tr><TH sortable sortDir="asc">Col</TH></tr></thead></table>
    );
    expect(container.querySelector('th').getAttribute('aria-sort')).toBe('ascending');
    rerender(<table><thead><tr><TH sortable sortDir="desc">Col</TH></tr></thead></table>);
    expect(container.querySelector('th').getAttribute('aria-sort')).toBe('descending');
  });
});

describe('<SortIndicator />', () => {
  it('rend ArrowUpDown si dir=null', () => {
    const { container } = render(<SortIndicator dir={null} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
  it('rend une icône différente selon dir', () => {
    const { container: c1 } = render(<SortIndicator dir="asc" />);
    const { container: c2 } = render(<SortIndicator dir="desc" />);
    expect(c1.innerHTML).not.toBe(c2.innerHTML);
  });
});

describe('<EmptyTable />', () => {
  it('rend titre par défaut "Aucune donnée"', () => {
    render(<table><tbody><EmptyTable colSpan={2} /></tbody></table>);
    expect(screen.getByText('Aucune donnée')).toBeInTheDocument();
  });

  it('rend titre + description + icône custom', () => {
    render(
      <table><tbody>
        <EmptyTable
          colSpan={3}
          icon={Inbox}
          title="Aucun service"
          description="Créez votre premier service depuis l'onglet Budget."
        />
      </tbody></table>
    );
    expect(screen.getByText('Aucun service')).toBeInTheDocument();
    expect(screen.getByText(/Créez votre premier service/)).toBeInTheDocument();
  });

  it('rend l\'action CTA si fournie', () => {
    render(
      <table><tbody>
        <EmptyTable colSpan={1} action={<button>Créer</button>} />
      </tbody></table>
    );
    expect(screen.getByRole('button', { name: 'Créer' })).toBeInTheDocument();
  });

  it('colSpan respecté', () => {
    const { container } = render(
      <table><tbody><EmptyTable colSpan={5} /></tbody></table>
    );
    expect(container.querySelector('td').getAttribute('colspan')).toBe('5');
  });
});

describe('<TR />', () => {
  it('highlight ajoute data-tr-highlight', () => {
    const { container } = render(
      <table><tbody><TR highlight>cells</TR></tbody></table>
    );
    expect(container.querySelector('tr').className).toContain('data-tr-highlight');
  });

  it('level=success/warning/danger applique le marker correspondant', () => {
    const { container } = render(
      <table><tbody><TR level="success">cells</TR></tbody></table>
    );
    expect(container.querySelector('tr').className).toContain('data-tr-success');
  });
});

describe('DataTable composé (default export)', () => {
  it('expose Head/Body/Foot/Row/HeadCell/Cell/Empty/SortIndicator', () => {
    expect(DataTable.Head).toBeDefined();
    expect(DataTable.Body).toBeDefined();
    expect(DataTable.Foot).toBeDefined();
    expect(DataTable.Row).toBeDefined();
    expect(DataTable.HeadCell).toBeDefined();
    expect(DataTable.Cell).toBeDefined();
    expect(DataTable.Empty).toBeDefined();
    expect(DataTable.SortIndicator).toBeDefined();
  });

  it('exemple complet : 2 colonnes, 3 lignes, total', () => {
    render(
      <DataTable darkMode={false}>
        <DataTable.Head>
          <DataTable.Row>
            <DataTable.HeadCell>Libellé</DataTable.HeadCell>
            <DataTable.HeadCell align="right">Montant</DataTable.HeadCell>
          </DataTable.Row>
        </DataTable.Head>
        <DataTable.Body>
          {[
            { id: 1, lib: 'Salaires', m: '320 000 €' },
            { id: 2, lib: 'Loyer',    m: '24 000 €' },
            { id: 3, lib: 'Autres',   m: '8 500 €' },
          ].map(r => (
            <DataTable.Row key={r.id}>
              <DataTable.Cell>{r.lib}</DataTable.Cell>
              <DataTable.Cell align="right" mono>{r.m}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable.Body>
        <DataTable.Foot>
          <DataTable.Row highlight>
            <DataTable.Cell bold>Total</DataTable.Cell>
            <DataTable.Cell align="right" mono bold>352 500 €</DataTable.Cell>
          </DataTable.Row>
        </DataTable.Foot>
      </DataTable>
    );
    expect(screen.getByText('Salaires')).toBeInTheDocument();
    expect(screen.getByText('Loyer')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('352 500 €')).toBeInTheDocument();
  });
});
