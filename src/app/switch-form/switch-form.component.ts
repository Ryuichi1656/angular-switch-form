import {
  Component,
  EffectRef,
  OnInit,
  computed,
  effect,
  inject,
  DestroyRef,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';

/**
 * 個人、法人の選択肢を定義
 */
type CustomerType = 'individual' | 'corporate';
/**
 * フォームのインターフェース定義
 */
interface SwitchForm {
  customerType: FormControl<CustomerType>; // 個人、法人のラジオボタン
  name: FormControl<string>; // お名前
  nameKana: FormControl<string>; // お名前カナ
  companyName: FormControl<string>; // 法人名
  companyNameKana: FormControl<string>; // 法人名カナ
}
/**
 * デフォルトで常に表示される FormControl のキーを管理
 */
const defaultDisplayForms: Readonly<(keyof SwitchForm)[]> = ['customerType'];
/**
 * 個人、法人選択による表示フォームのキーのパターンを管理
 * 特定の customerType が選択された時に表示されるフォーム要素を定義します。
 */
const dynamicDisplayFormsPattern: Readonly<{
  [customerType in 'individual' | 'corporate']: (keyof SwitchForm)[];
}> = {
  individual: ['name', 'nameKana'],
  corporate: ['companyName', 'companyNameKana'],
};
/**
 * 各 FormControl に対応するバリデーション設定を管理
 * バリデーションルールの宣言的な定義により、見通しが良くなります。
 */
const formValidationManager: Readonly<{
  [key in keyof SwitchForm]: ValidatorFn[];
}> = {
  customerType: [],
  name: [Validators.required],
  nameKana: [Validators.required],
  companyName: [Validators.required],
  companyNameKana: [Validators.required],
};

@Component({
  selector: 'app-switch-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './switch-form.component.html',
  styleUrl: './switch-form.component.scss',
})
export class SwitchFormComponent implements OnInit {
  private readonly _destroyRef = inject(DestroyRef);
  /**
   * 現在選択している個人/法人タイプを管理する Signal
   * `FormControl` の `valueChanges` と連携して更新される
   */
  private _currentCustomerType = signal<CustomerType | null>(null);
  /**
   * フォームが切り替わるタイミングでバリデーションを切り替えるための effect
   */
  private _switchValidatorsEffect: EffectRef; // Effect の参照を保持
  /**
   * フォームの定義
   */
  switchForm: FormGroup<SwitchForm> = new FormGroup<SwitchForm>({
    customerType: new FormControl('individual', { nonNullable: true }),
    name: new FormControl('', { nonNullable: true }),
    nameKana: new FormControl('', { nonNullable: true }),
    companyName: new FormControl('', { nonNullable: true }),
    companyNameKana: new FormControl('', { nonNullable: true }),
  });
  /**
   * 選択している個人/法人タイプに応じて、動的に表示するフォームのキー群を返却する
   * この Signal の値が変更されると、依存する部分（HTMLテンプレートや Effect）が自動的に更新される
   */
  dynamicDisplayForms = computed(() => {
    return this._getDynamicDisplayForms(
      this._currentCustomerType() ?? 'individual',
    );
  });

  constructor() {
    // effect の登録
    // dynamicDisplayForms の値が変更されるたびに _switchValidators が実行される
    this._switchValidatorsEffect = effect(() => {
      this._switchValidators(this.dynamicDisplayForms());
    });
  }

  // ngOnInit 内での customerType の値の監視
  ngOnInit(): void {
    // もし、デフォルト表示のフォームのバリデーションがあればここで設定する

    this.switchForm.controls.customerType.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((value: CustomerType) => {
        this._currentCustomerType.set(value);
      });
    this._currentCustomerType.set(this.switchForm.controls.customerType.value);
  }

  ngOnDestroy(): void {
    this._switchValidatorsEffect.destroy();
  }

  /**
   * 表示される FormControl のバリデーションを設定し、非表示の FormControl のバリデーションをクリアする
   */
  private _switchValidators(dynamicDisplayForms: (keyof SwitchForm)[]) {
    const allForms = Object.keys(formValidationManager) as (keyof SwitchForm)[];
    // [1] 現在表示されているフォームにバリデーションを適用
    dynamicDisplayForms.forEach((form) => {
      this.switchForm.controls[form].clearValidators();
      this.switchForm.controls[form].setValidators(formValidationManager[form]);
      this.switchForm.controls[form].updateValueAndValidity();
    });
    // [2] 非表示のフォームからバリデーションをクリア
    allForms
      .filter(
        (form) =>
          !(
            dynamicDisplayForms.includes(form) ||
            defaultDisplayForms.includes(form)
          ),
      )
      .forEach((form) => {
        this.switchForm.controls[form].clearValidators();
        this.switchForm.controls[form].updateValueAndValidity();
      });
  }

  /**
   * 選択された顧客タイプに基づいて、動的に表示するフォームのキー群を決定する
   */
  private _getDynamicDisplayForms(customerType: CustomerType) {
    return dynamicDisplayFormsPattern[customerType];
  }

  onSubmit() {
    // フォーム送信ロジックを実装する
    console.warn(this.switchForm);
  }
}
