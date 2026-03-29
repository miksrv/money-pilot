import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Message } from 'simple-react-ui-kit'

import { useImportCsvMutation } from '@/api'

import styles from './styles.module.sass'

export const ImportCsv: React.FC = () => {
    const { t } = useTranslation()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | undefined>()
    const [importCsv, { isLoading, data: result, reset }] = useImportCsvMutation()
    const [error, setError] = useState<string | undefined>()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        setSelectedFile(file)
        setError(undefined)
        reset()
    }

    const handleChoose = () => {
        fileInputRef.current?.click()
    }

    const handleImport = async () => {
        if (!selectedFile) {
            return
        }

        setError(undefined)
        reset()

        const formData = new FormData()
        formData.append('file', selectedFile)

        try {
            await importCsv(formData).unwrap()
            setSelectedFile(undefined)

            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch {
            setError(t('common.errors.unknown', 'An error occurred. Please try again.'))
        }
    }

    return (
        <div className={styles.importCsv}>
            <input
                ref={fileInputRef}
                type='file'
                accept='.csv'
                aria-label={t('settings.importCsv.chooseFile', 'Choose CSV file')}
                className={styles.hiddenInput}
                onChange={handleFileChange}
            />

            {!selectedFile && !result && (
                <Button
                    mode='secondary'
                    label={t('settings.importCsv.chooseFile', 'Choose CSV file')}
                    onClick={handleChoose}
                />
            )}

            {selectedFile && !result && (
                <div className={styles.fileRow}>
                    <span className={styles.fileName}>{selectedFile.name}</span>
                    <Button
                        mode='outline'
                        label={t('settings.importCsv.changeFile', 'Change')}
                        onClick={handleChoose}
                        disabled={isLoading}
                    />
                    <Button
                        mode='primary'
                        label={isLoading ? t('common.loading', 'Loading...') : t('settings.importCsv.import', 'Import')}
                        onClick={() => void handleImport()}
                        disabled={isLoading}
                    />
                </div>
            )}

            {error && <Message type='error'>{error}</Message>}

            {result && (
                <div className={styles.result}>
                    <Message type='success'>
                        {t('settings.importCsv.importedCount', 'Imported {{count}} transactions', {
                            count: result.imported
                        })}
                    </Message>
                    <div className={styles.resultDetails}>
                        <span>
                            {t('settings.importCsv.accountsCreated', 'Accounts created: {{count}}', {
                                count: result.accounts_created
                            })}
                        </span>
                        <span className={styles.separator}>|</span>
                        <span>
                            {t('settings.importCsv.payeesCreated', 'Payees created: {{count}}', {
                                count: result.payees_created
                            })}
                        </span>
                        <span className={styles.separator}>|</span>
                        <span>
                            {t('settings.importCsv.categoriesCreated', 'Categories created: {{count}}', {
                                count: result.categories_created
                            })}
                        </span>
                        <span className={styles.separator}>|</span>
                        <span>
                            {t('settings.importCsv.skipped', 'Skipped: {{count}}', {
                                count: result.skipped
                            })}
                        </span>
                    </div>
                    <Button
                        mode='outline'
                        label={t('settings.importCsv.importAnother', 'Import another file')}
                        onClick={() => {
                            reset()
                            setError(undefined)
                        }}
                    />
                </div>
            )}
        </div>
    )
}
